import StripeService from "../services/stripe.service.js";




export const createPaymentSession = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    if (!invoiceId) {
      return res.status(400).json({ success: false, message: "Invoice ID is required" });
    }

    const session = await StripeService.createInvoicePaymentSession(
      req.user.organizationId,
      invoiceId
    );

    res.status(200).json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Create Payment Session Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};




export const createSubscriptionCheckout = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan || !["pro", "enterprise"].includes(plan)) {
      return res.status(400).json({ success: false, message: "A valid plan tier (pro, enterprise) is required" });
    }

    const session = await StripeService.createSubscriptionSession(
      req.user.organizationId,
      plan
    );

    res.status(200).json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Create Subscription Session Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};




export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const payload = req.body;

  try {
    const result = await StripeService.handleWebhook(payload, sig);
    res.status(200).json({ received: true, ...result });
  } catch (error) {
    console.error("Stripe Webhook Controller Error:", error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};