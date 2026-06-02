import PlanService from "../services/plan.service.js";
import AuditService from "../services/audit.service.js";

export const createPlan = async (req, res) => {
  try {
    const plan = await PlanService.createPlan(req.user.organizationId, req.body);
    await AuditService.logAction(req.user.organizationId, req.user.userId || "system", "PLAN_CREATED", { planId: plan._id, name: plan.name }, req.ip, req.headers["user-agent"]);
    res.status(201).json({ success: true, plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const listPlans = async (req, res) => {
  try {
    const plans = await PlanService.listPlans(req.user.organizationId, req.query);
    res.json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const plan = await PlanService.updatePlan(req.user.organizationId, req.params.id, req.body);
    await AuditService.logAction(req.user.organizationId, req.user.userId || "system", "PLAN_UPDATED", { planId: plan._id }, req.ip, req.headers["user-agent"]);
    res.json({ success: true, plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const archivePlan = async (req, res) => {
  try {
    const plan = await PlanService.archivePlan(req.user.organizationId, req.params.id);
    await AuditService.logAction(req.user.organizationId, req.user.userId || "system", "PLAN_ARCHIVED", { planId: plan._id }, req.ip, req.headers["user-agent"]);
    res.json({ success: true, plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
