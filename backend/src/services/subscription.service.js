import Organization from "../models/organization.model.js";
import Client from "../models/client.model.js";
import Invoice from "../models/invoice.model.js";
import sendEmail from "../utils/sendEmail.js";

const PLAN_LIMITS = {
  free: { maxClients: 3, maxInvoicesPerMonth: 5 },
  pro: { maxClients: 50, maxInvoicesPerMonth: 100 },
  enterprise: { maxClients: Infinity, maxInvoicesPerMonth: Infinity },
};

class SubscriptionService {

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
    console.log("SubscriptionService: Starting auto-invoicing scheduled run...");
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
