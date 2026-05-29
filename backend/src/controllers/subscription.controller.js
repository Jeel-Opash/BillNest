import SubscriptionService from "../services/subscription.service.js";
import AuditService from "../services/audit.service.js";




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
