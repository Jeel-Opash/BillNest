import Organization from "../models/organization.model.js";
import Client from "../models/client.model.js";
import Invoice from "../models/invoice.model.js";
import Subscription from "../models/subscription.model.js";
import SubscriptionPlan from "../models/subscriptionPlan.model.js";
import sendEmail from "../utils/sendEmail.js";

const PLAN_LIMITS = {
  free: { maxClients: 5, maxInvoicesPerMonth: 10 },
  starter: { maxClients: 20, maxInvoicesPerMonth: 50 },
  pro: { maxClients: 100, maxInvoicesPerMonth: 500 },
  enterprise: { maxClients: Infinity, maxInvoicesPerMonth: Infinity },
};

class SubscriptionService {
  nextDateFromCycle(date, cycle) {
    const next = new Date(date);
    if (cycle === "yearly") next.setFullYear(next.getFullYear() + 1);
    else if (cycle === "quarterly") next.setMonth(next.getMonth() + 3);
    else next.setMonth(next.getMonth() + 1);
    return next;
  }

  async createSubscription(organizationId, data, userId) {
    if (!data.clientId || !data.planId) throw new Error("clientId and planId are required");

    const [client, plan] = await Promise.all([
      Client.findOne({ _id: data.clientId, organization: organizationId, isActive: true }),
      SubscriptionPlan.findOne({ _id: data.planId, organization: organizationId, isActive: true }),
    ]);
    if (!client) throw new Error("Client not found or access denied");
    if (!plan) throw new Error("Plan not found or archived");

    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const nextInvoiceDate = data.nextInvoiceDate ? new Date(data.nextInvoiceDate) : this.nextDateFromCycle(startDate, plan.billingCycle);

    return Subscription.create({
      organization: organizationId,
      tenantId: organizationId,
      client: client._id,
      clientId: client._id,
      planId: plan._id,
      planName: plan.name,
      description: plan.description,
      amount: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      startDate,
      currentPeriodStart: startDate,
      currentPeriodEnd: nextInvoiceDate,
      nextBillingDate: nextInvoiceDate,
      nextInvoiceDate,
      lineItems: [{ description: plan.name, quantity: 1, unitPrice: plan.price, amount: plan.price }],
      taxRate: Number(data.taxRate || 0),
      autoCharge: data.autoCharge !== false,
      autoInvoice: data.autoInvoice !== false,
      createdBy: userId,
    });
  }

  async listSubscriptions(organizationId, query = {}) {
    const filter = { organization: organizationId };
    ["status", "clientId", "planId"].forEach((f) => { if (query[f]) filter[f] = query[f]; });
    return Subscription.find(filter)
      .populate("client", "name email company")
      .populate("planId", "name price currency billingCycle")
      .sort({ createdAt: -1 });
  }

  async getSubscription(organizationId, id) {
    const subscription = await Subscription.findOne({ _id: id, organization: organizationId })
      .populate("client")
      .populate("planId");
    if (!subscription) throw new Error("Subscription not found or access denied");
    const invoices = await Invoice.find({ organization: organizationId, subscriptionId: subscription._id }).sort({ createdAt: -1 });
    return { subscription, invoices };
  }

  async updateStatus(organizationId, id, status, options = {}) {
    const subscription = await Subscription.findOne({ _id: id, organization: organizationId });
    if (!subscription) throw new Error("Subscription not found or access denied");
    if (status === "cancelled") {
      subscription.cancelAtPeriodEnd = options.cancelAtPeriodEnd !== false;
      if (!subscription.cancelAtPeriodEnd) subscription.cancelledAt = new Date();
    }
    subscription.status = status;
    await subscription.save();
    return subscription;
  }

  async getOrganizationPlan(organizationId) {
    const org = await Organization.findById(organizationId);
    if (!org) throw new Error("Organization not found");
    const currentPlan = org.subscription?.plan || "free";
    return {
      plan: currentPlan,
      limits: PLAN_LIMITS[currentPlan] || PLAN_LIMITS.free,
      status: org.subscription?.status || "active",
      renewalDate: org.subscription?.renewalDate,
    };
  }

  async enforceClientLimit(organizationId) {
    const { limits } = await this.getOrganizationPlan(organizationId);
    if (limits.maxClients === Infinity) return;
    const count = await Client.countDocuments({ organization: organizationId, isActive: true });
    if (count >= limits.maxClients) {
      throw new Error(`Client limit reached (${limits.maxClients}). Please upgrade your plan.`);
    }
  }

  async enforceInvoiceLimit(organizationId) {
    const { limits } = await this.getOrganizationPlan(organizationId);
    if (limits.maxInvoicesPerMonth === Infinity) return;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const count = await Invoice.countDocuments({ organization: organizationId, createdAt: { $gte: startOfMonth } });
    if (count >= limits.maxInvoicesPerMonth) {
      throw new Error(`Invoice limit reached (${limits.maxInvoicesPerMonth}/month). Please upgrade your plan.`);
    }
  }

  async runAutoInvoicing() {
    const now = new Date();
    const dueSubscriptions = await Subscription.find({ status: "active", autoInvoice: true, nextInvoiceDate: { $lte: now } });
    let created = 0;
    for (const sub of dueSubscriptions) {
      const exists = await Invoice.exists({ organization: sub.organization, subscriptionId: sub._id, createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } });
      if (exists) continue;
      const subtotal = sub.amount;
      const taxAmount = Number(((subtotal * sub.taxRate) / 100).toFixed(2));
      const totalAmount = subtotal + taxAmount;
      await Invoice.create({
        organization: sub.organization, tenantId: sub.organization,
        client: sub.client, clientId: sub.client,
        subscriptionId: sub._id,
        invoiceNumber: `SUB-${sub._id.toString().slice(-6).toUpperCase()}-${Date.now()}`,
        status: "sent", currency: sub.currency,
        lineItems: sub.lineItems,
        items: sub.lineItems.map((i) => ({ name: i.description, quantity: i.quantity, price: i.unitPrice })),
        subtotal, taxRate: sub.taxRate, taxAmount, discountAmount: 0, totalAmount, total: totalAmount,
        dueDate: sub.nextInvoiceDate, sentAt: now, createdBy: sub.createdBy,
      });
      const nextDate = this.nextDateFromCycle(sub.nextInvoiceDate, sub.billingCycle);
      sub.nextInvoiceDate = nextDate;
      sub.nextBillingDate = nextDate;
      sub.currentPeriodStart = now;
      sub.currentPeriodEnd = nextDate;
      await sub.save();
      created++;
    }
    return created;
  }

  async runDunningScheduler() {
    const overdueInvoices = await Invoice.find({ status: "overdue" }).populate("client organization");
    let reminderCount = 0;
    for (const invoice of overdueInvoices) {
      if (!invoice.client?.email) continue;
      try {
        await sendEmail({
          to: invoice.client.email,
          subject: `Overdue Payment Reminder — Invoice ${invoice.invoiceNumber}`,
          text: `Hello ${invoice.client.name},\n\nInvoice ${invoice.invoiceNumber} is overdue.\n\nAmount: ${(invoice.total || invoice.totalAmount || 0).toFixed(2)}\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nPlease process your payment at your earliest convenience.\n\nThank you,\n${invoice.organization?.name || "BillNest Team"}`,
        });
        reminderCount++;
      } catch (_) {}
    }
    return reminderCount;
  }
}

export default new SubscriptionService();
