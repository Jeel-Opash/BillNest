import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "INR", uppercase: true },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    stripePriceId: { type: String, default: "" },
    stripeProductId: { type: String, default: "" },
  },
  { timestamps: true }
);

subscriptionPlanSchema.pre("validate", function () {
  if (this.tenantId) {
    this.organization = this.tenantId;
  } else if (this.organization) {
    this.tenantId = this.organization;
  }
});

subscriptionPlanSchema.index({ tenantId: 1, isActive: 1 });
subscriptionPlanSchema.index({ tenantId: 1, name: 1 }, { unique: true });

const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);

export default SubscriptionPlan;
