import Stripe from "stripe";
import Invoice from "../models/invoice.model.js";
import Organization from "../models/organization.model.js";
import WebhookEvent from "../models/webhookEvent.model.js";
import InvoiceService from "./invoice.service.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock_stripe_key_placeholder");

class StripeService {

  async createInvoicePaymentSession(organizationId, invoiceId) {
    const invoice = await Invoice.findOne({ _id: invoiceId, organization: organizationId }).populate("client");
    if (!invoice) {
      throw new Error("Invoice not found or access denied");
    }

    if (invoice.status === "paid") {
      throw new Error("Invoice is already paid");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: invoice.client.currency ? invoice.client.currency.toLowerCase() : "usd",
            product_data: {
              name: `Invoice #${invoice.invoiceNumber}`,
              description: `Payment for BillNest Invoice ${invoice.invoiceNumber}`,
            },
            unit_amount: Math.round(invoice.total * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        invoiceId: invoice._id.toString(),
        organizationId: organizationId.toString(),
        type: "one_off_invoice",
      },
      success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-failed`,
    });

    return session;
  }


  async createSubscriptionSession(organizationId, planTier) {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    const prices = {
      pro: process.env.STRIPE_PRICE_PRO_ID || "price_mock_pro",
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE_ID || "price_mock_enterprise",
    };

    if (!prices[planTier]) {
      throw new Error("Invalid plan tier selected");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: prices[planTier],
          quantity: 1,
        },
      ],
      mode: "subscription",
      metadata: {
        organizationId: organizationId.toString(),
        plan: planTier,
        type: "subscription_billing",
      },
      success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/subscription-failed`,
    });

    return session;
  }




  async handleWebhook(rawBody, signature) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
      if (webhookSecret && signature) {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } else {

        event = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
      }
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    const eventId = event.id || `evt_mock_${Date.now()}`;


    const existingLog = await WebhookEvent.findOne({ eventId });
    if (existingLog) {
      console.log(`Duplicate Stripe Webhook event: ${eventId} has already been processed.`);
      return { status: "ignored_duplicate" };
    }


    await WebhookEvent.create({ eventId });


    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { invoiceId, organizationId, plan, type } = session.metadata || ;

        if (type === "one_off_invoice" && invoiceId && organizationId) {

          await InvoiceService.transitionStatus(organizationId, invoiceId, "paid");
          console.log(`Payment confirmed via Stripe for Invoice ID: ${invoiceId}`);
        } else if (type === "subscription_billing" && organizationId && plan) {

          await Organization.findByIdAndUpdate(organizationId, {
            $set: {
              "subscription.plan": plan,
              "subscription.status": "active",
              "subscription.renewalDate": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
          console.log(`Subscription upgraded via Stripe for Org ID: ${organizationId} to ${plan}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const stripeInvoice = event.data.object;

        const invoiceId = stripeInvoice.metadata ? stripeInvoice.metadata.invoiceId : null;
        const organizationId = stripeInvoice.metadata ? stripeInvoice.metadata.organizationId : null;

        if (invoiceId && organizationId) {

          await Invoice.findOneAndUpdate(
            { _id: invoiceId, organization: organizationId },
            { $set: { status: "overdue" } }
          );
          console.log(`Stripe webhook: payment failed for invoice: ${invoiceId}. Set status to overdue.`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const organizationId = subscription.metadata ? subscription.metadata.organizationId : null;
        if (organizationId) {
          const cancelAtPeriodEnd = subscription.cancel_at_period_end;
          await Organization.findByIdAndUpdate(organizationId, {
            $set: {
              "subscription.status": cancelAtPeriodEnd ? "cancelled" : "active",
              "subscription.renewalDate": new Date(subscription.current_period_end * 1000),
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const organizationId = subscription.metadata ? subscription.metadata.organizationId : null;
        if (organizationId) {
          await Organization.findByIdAndUpdate(organizationId, {
            $set: {
              "subscription.plan": "free",
              "subscription.status": "active",
              "subscription.renewalDate": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return { status: "processed", eventId };
  }
}

export default new StripeService();
