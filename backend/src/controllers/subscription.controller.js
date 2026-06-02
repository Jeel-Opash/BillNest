import SubscriptionService from "../services/subscription.service.js";
import AuditService from "../services/audit.service.js";

export const createSubscription = async (req, res) => {
  try {
    const subscription = await SubscriptionService.createSubscription(
      req.user.organizationId,
      req.body,
      req.user.userId
    );
    await AuditService.logAction(req.user.organizationId, req.user.userId || "system", "SUBSCRIPTION_CREATED", { subscriptionId: subscription._id }, req.ip, req.headers["user-agent"]);
    res.status(201).json({ success: true, subscription });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const listSubscriptions = async (req, res) => {
  try {
    const subscriptions = await SubscriptionService.listSubscriptions(req.user.organizationId, req.query);
    res.json({ success: true, subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubscription = async (req, res) => {
  try {
    const data = await SubscriptionService.getSubscription(req.user.organizationId, req.params.id);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const subscription = await SubscriptionService.updateStatus(req.user.organizationId, req.params.id, "cancelled", req.body);
    await AuditService.logAction(req.user.organizationId, req.user.userId || "system", "SUBSCRIPTION_CANCELLED", { subscriptionId: subscription._id }, req.ip, req.headers["user-agent"]);
    res.json({ success: true, subscription });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const pauseSubscription = async (req, res) => {
  try {
    const subscription = await SubscriptionService.updateStatus(req.user.organizationId, req.params.id, "paused");
    await AuditService.logAction(req.user.organizationId, req.user.userId || "system", "SUBSCRIPTION_PAUSED", { subscriptionId: subscription._id }, req.ip, req.headers["user-agent"]);
    res.json({ success: true, subscription });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resumeSubscription = async (req, res) => {
  try {
    const subscription = await SubscriptionService.updateStatus(req.user.organizationId, req.params.id, "active");
    await AuditService.logAction(req.user.organizationId, req.user.userId || "system", "SUBSCRIPTION_RESUMED", { subscriptionId: subscription._id }, req.ip, req.headers["user-agent"]);
    res.json({ success: true, subscription });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


export const getSubscriptionInfo = async (req, res) => {
  try {
    const info = await SubscriptionService.getOrganizationPlan(req.user.organizationId);
    res.status(200).json({ success: true, subscription: info });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




export const triggerDunningRun = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const remindersSent = await SubscriptionService.runDunningScheduler();


    await AuditService.logAction(
      orgId,
      req.user.userId || "system",
      "DUNNING_CYCLE_TRIGGERED",
      { remindersSent },
      req.ip,
      req.headers["user-agent"]
    );

    res.status(200).json({
      success: true,
      message: `Dunning routine finished. Dispatched ${remindersSent} reminders.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const triggerAutoInvoiceRun = async (req, res) => {
  try {
    const invoicesCreated = await SubscriptionService.runAutoInvoicing();
    await AuditService.logAction(req.user.organizationId, req.user.userId || "system", "AUTO_INVOICE_TRIGGERED", { invoicesCreated }, req.ip, req.headers["user-agent"]);
    res.json({ success: true, invoicesCreated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
