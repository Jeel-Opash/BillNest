import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    logo: { type: String, default: "" },
    accessCode: { type: String, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    plan: { type: String, enum: ["free", "starter", "pro", "enterprise", "business"], default: "free" },
    currency: { type: String, default: "INR" },
    country: { type: String, default: "IN" },
    industry: { type: String, default: "Technology" },
    businessType: { type: String, default: "SaaS" },
    timezone: { type: String, default: "Asia/Kolkata" },
    taxId: { type: String, default: "" },
    stripeCustomerId: { type: String, default: "" },
    subscription: {
      plan: { type: String, enum: ["free", "starter", "pro", "enterprise"], default: "free" },
      status: { type: String, enum: ["active", "cancelled", "past_due"], default: "active" },
      renewalDate: { type: Date },
    },
    settings: {
      invoicePrefix: { type: String, default: "INV" },
      locale: { type: String, default: "en-IN" },
      timezone: { type: String, default: "Asia/Kolkata" },
      taxRate: { type: Number, default: 0 },
      darkMode: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

organizationSchema.index({ owner: 1 });
organizationSchema.index({ accessCode: 1 }, { sparse: true });

const Organization = mongoose.model("Organization", organizationSchema);
export default Organization;
