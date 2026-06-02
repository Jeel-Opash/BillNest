import SubscriptionPlan from "../models/subscriptionPlan.model.js";
import Subscription from "../models/subscription.model.js";

class PlanService {
  async createPlan(organizationId, data) {
    if (!data.name || data.price === undefined) {
      throw new Error("Plan name and price are required");
    }

    return SubscriptionPlan.create({
      organization: organizationId,
      tenantId: organizationId,
      name: data.name,
      description: data.description || "",
      price: Number(data.price),
      currency: (data.currency || "INR").toUpperCase(),
      billingCycle: data.billingCycle || "monthly",
      features: Array.isArray(data.features) ? data.features : [],
      stripePriceId: data.stripePriceId || "",
      stripeProductId: data.stripeProductId || "",
    });
  }

  async listPlans(organizationId, query = {}) {
    const filter = { organization: organizationId };
    if (query.includeArchived !== "true") filter.isActive = true;
    return SubscriptionPlan.find(filter).sort({ createdAt: -1 });
  }

  async updatePlan(organizationId, id, data) {
    const allowed = ["name", "description", "features", "isActive", "stripeProductId"];
    const update = {};
    allowed.forEach((field) => {
      if (data[field] !== undefined) update[field] = data[field];
    });

    const plan = await SubscriptionPlan.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!plan) throw new Error("Plan not found or access denied");
    return plan;
  }

  async archivePlan(organizationId, id) {
    const activeSubscriptions = await Subscription.countDocuments({
      organization: organizationId,
      planId: id,
      status: { $in: ["active", "past_due", "paused"] },
    });
    if (activeSubscriptions > 0) {
      throw new Error("Cannot archive a plan with active subscriptions");
    }

    const plan = await SubscriptionPlan.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!plan) throw new Error("Plan not found or access denied");
    return plan;
  }
}

export default new PlanService();
