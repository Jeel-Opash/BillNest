import Stripe from "stripe";
import Invoice from "../models/invoice.model.js";
import Organization from "../models/organization.model.js";
import WebhookEvent from "../models/webhookEvent.model.js";
import InvoiceService from "./invoice.service.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

class StripeService {
  async createInvoicePaymentSession(organizationId, invoiceId) {
    const invoice = await Invoice.findOne({ _id: invoiceId, organization: organizationId }).populate("client");
    if (!invoice) throw new Error("Invoice not found or access denied");
    if (invoice.status === "paid") throw new Error("Invoice is already paid");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: (invoice.currency || invoice.client?.currency || "usd").toLowerCase(),
          product_data: { name: `Invoice #${invoice.invoiceNumber}`, description: `BillNest Invoice ${invoice.invoiceNumber}` },
          unit_amount: Math.round((invoice.total || invoice.totalAmount || 0) * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      metadata: { invoiceId: invoice._id.toString(), organizationId: organizationId.toString(), type: "one_off_invoice" },
      success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-failed`,
    });
    return session;
  }

  async createSubscriptionSession(organizationId, planTier) {
    const organization = await Organization.findById(organizationId);
    if (!organization) throw new Error("Organization not found");
    const prices = {
      pro: process.env.STRIPE_PRICE_PRO_ID || "price_mock_pro",
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE_ID || "price_mock_enterprise",
    };
    if (!prices[planTier]) throw new Error("Invalid plan tier");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: prices[planTier], quantity: 1 }],
      mode: "subscription",
      metadata: { organizationId: organizationId.toString(), plan: planTier, type: "subscription_billing" },
      success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/subscription-failed`,
    });
    return session;
  }

  async handleWebhook(rawBody, signature) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
      event = webhookSecret && signature
        ? stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
        : (typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody);
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    const eventId = event.id || `evt_mock_${Date.now()}`;
    const existingLog = await WebhookEvent.findOne({ stripeEventId: eventId });
    if (existingLog?.status === "processed") return { status: "ignored_duplicate" };

    await WebhookEvent.findOneAndUpdate(
      { stripeEventId: eventId },
      { $setOnInsert: { stripeEventId: eventId, type: event.type, payload: event, status: "pending" } },
      { upsert: true, new: true }
    );

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const { invoiceId, organizationId, plan, type } = session.metadata || {};
          if (type === "one_off_invoice" && invoiceId && organizationId) {
            await InvoiceService.transitionStatus(organizationId, invoiceId, "paid");
          } else if (type === "subscription_billing" && organizationId && plan) {
            await Organization.findByIdAndUpdate(organizationId, {
              $set: { "subscription.plan": plan, "subscription.status": "active", "subscription.renewalDate": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
            });
          }
          break;
        }
        case "invoice.payment_failed": {
          const stripeInvoice = event.data.object;
          const { invoiceId, organizationId } = stripeInvoice.metadata || {};
          if (invoiceId && organizationId) {
            await Invoice.findOneAndUpdate({ _id: invoiceId, organization: organizationId }, { $set: { status: "overdue" } });
          }
          break;
        }
        case "customer.subscription.updated": {
          const sub = event.data.object;
          const orgId = sub.metadata?.organizationId;
          if (orgId) {
            await Organization.findByIdAndUpdate(orgId, {
              $set: {
                "subscription.status": sub.cancel_at_period_end ? "cancelled" : "active",
                "subscription.renewalDate": new Date(sub.current_period_end * 1000),
              },
            });
          }
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object;
          const orgId = sub.metadata?.organizationId;
          if (orgId) {
            await Organization.findByIdAndUpdate(orgId, {
              $set: { "subscription.plan": "free", "subscription.status": "active", "subscription.renewalDate": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
            });
          }
          break;
        }
        default:
          break;
      }
      await WebhookEvent.findOneAndUpdate({ stripeEventId: eventId }, { status: "processed", processedAt: new Date() });
    } catch (err) {
      await WebhookEvent.findOneAndUpdate({ stripeEventId: eventId }, { status: "failed", error: err.message });
    }

    return { status: "processed", eventId };
  }
}

export default new StripeService();
