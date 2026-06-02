import Organization from "../models/organization.model.js";
import Client from "../models/client.model.js";
import Invoice from "../models/invoice.model.js";
import Subscription from "../models/subscription.model.js";
import SubscriptionPlan from "../models/subscriptionPlan.model.js";
import sendEmail from "../utils/sendEmail.js";

const PLAN_LIMITS = {
  free: { maxClients: 3, maxInvoicesPerMonth: 5 },
  pro: { maxClients: 50, maxInvoicesPerMonth: 100 },
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
    if (!data.clientId || !data.planId) {
      throw new Error("clientId and planId are required");
    }

    const [client, plan] = await Promise.all([
      Client.findOne({ _id: data.clientId, organization: organizationId, isActive: true }),
      SubscriptionPlan.findOne({ _id: data.planId, organization: organizationId, isActive: true }),
    ]);
    if (!client) throw new Error("Client not found or access denied");
    if (!plan) throw new Error("Plan not found or archived");

    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const nextInvoiceDate = data.nextInvoiceDate
      ? new Date(data.nextInvoiceDate)
      : this.nextDateFromCycle(startDate, plan.billingCycle);

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
      lineItems: [
        {
          description: plan.name,
          quantity: 1,
          unitPrice: plan.price,
          amount: plan.price,
        },
      ],
      taxRate: Number(data.taxRate || 0),
      autoCharge: data.autoCharge !== false,
      autoInvoice: data.autoInvoice !== false,
      createdBy: userId,
    });
  }

  async listSubscriptions(organizationId, query = {}) {
    const filter = { organization: organizationId };
    ["status", "clientId", "planId"].forEach((field) => {
      if (query[field]) filter[field] = query[field];
    });
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

    const invoices = await Invoice.find({
      organization: organizationId,
      subscriptionId: subscription._id,
    }).sort({ createdAt: -1 });

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
    if (!org) {
      throw new Error("Organization not found");
    }
    const currentPlan = org.subscription?.plan || "free";
    return {
      plan: currentPlan,
      limits: PLAN_LIMITS[currentPlan],
      status: org.subscription?.status || "active",
      renewalDate: org.subscription?.renewalDate,
    };
  }


  async enforceClientLimit(organizationId) {
    const { limits } = await this.getOrganizationPlan(organizationId);
    const activeClientsCount = await Client.countDocuments({
      organization: organizationId,
      isActive: true,
    });

    if (activeClientsCount >= limits.maxClients) {
      throw new Error(
        `Workspace client limit reached (${limits.maxClients} clients). Please upgrade your subscription plan.`
      );
    }
  }


  async enforceInvoiceLimit(organizationId) {
    const { limits } = await this.getOrganizationPlan(organizationId);
    if (limits.maxInvoicesPerMonth === Infinity) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const invoicesThisMonthCount = await Invoice.countDocuments({
      organization: organizationId,
      createdAt: { $gte: startOfMonth },
    });

    if (invoicesThisMonthCount >= limits.maxInvoicesPerMonth) {
      throw new Error(
        `Workspace invoice limit for this month reached (${limits.maxInvoicesPerMonth} invoices). Please upgrade your subscription plan.`
      );
    }
  }


  async runAutoInvoicing() {
    const now = new Date();
    const dueSubscriptions = await Subscription.find({
      status: "active",
      autoInvoice: true,
      nextInvoiceDate: { $lte: now },
    });

    let created = 0;
    for (const subscription of dueSubscriptions) {
      const invoiceExists = await Invoice.exists({
        organization: subscription.organization,
        subscriptionId: subscription._id,
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
      });
      if (invoiceExists) continue;

      const subtotal = subscription.amount;
      const taxAmount = Number(((subtotal * subscription.taxRate) / 100).toFixed(2));
      const totalAmount = subtotal + taxAmount;

      await Invoice.create({
        organization: subscription.organization,
        tenantId: subscription.organization,
        client: subscription.client,
        clientId: subscription.client,
        subscriptionId: subscription._id,
        invoiceNumber: `SUB-${subscription._id.toString().slice(-6).toUpperCase()}-${Date.now()}`,
        status: "sent",
        currency: subscription.currency,
        lineItems: subscription.lineItems,
        items: subscription.lineItems.map((item) => ({
          name: item.description,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
        subtotal,
        taxRate: subscription.taxRate,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        total: totalAmount,
        dueDate: subscription.nextInvoiceDate,
        sentAt: now,
        createdBy: subscription.createdBy,
      });

      const nextDate = this.nextDateFromCycle(subscription.nextInvoiceDate, subscription.billingCycle);
      subscription.nextInvoiceDate = nextDate;
      subscription.nextBillingDate = nextDate;
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = nextDate;
      await subscription.save();
      created++;
    }

    return created;
  }


  async runDunningScheduler() {
    console.log("SubscriptionService: Checking for overdue invoices for automated dunning...");

    const overdueInvoices = await Invoice.find({ status: "overdue" }).populate("client organization");
    
    let reminderCount = 0;

    for (const invoice of overdueInvoices) {
      if (!invoice.client || !invoice.client.email) continue;

      try {
        await sendEmail({
          to: invoice.client.email,
          subject: `Urgent: Overdue Payment Reminder for Invoice ${invoice.invoiceNumber}`,
          text: `Hello ${invoice.client.name},\n\nThis is a friendly reminder that invoice ${invoice.invoiceNumber} is currently overdue.\n\nInvoice Amount: $${invoice.total.toFixed(2)}\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nPlease make arrangements to process your payment as soon as possible.\n\nIf you have already processed your payment, please disregard this email.\n\nThank you,\n${invoice.organization ? invoice.organization.name : "BillNest Team"}`,
        });
        reminderCount++;
      } catch (err) {
        console.error(`Failed to send dunning email for invoice: ${invoice._id}`, err);
      }
    }

    console.log(`SubscriptionService: Sent ${reminderCount} automated dunning emails successfully.`);
    return reminderCount;
  }
}

export default new SubscriptionService();
