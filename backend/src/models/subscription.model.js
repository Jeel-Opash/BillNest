import mongoose from "mongoose";

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },


    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },


    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },


    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    planName: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      required: true,
      default: "INR",
    },

    billingCycle: {
      type: String,
      enum: ["monthly", "quarterly", "yearly"],
      default: "monthly",
    },

    status: {
      type: String,
      enum: ["active", "paused", "cancelled", "past_due"],
      default: "active",
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
    },

    nextBillingDate: {
      type: Date,
      required: true,
    },

    trialEndsAt: {
      type: Date,
    },

    cancelledAt: {
      type: Date,
    },

    cancelReason: {
      type: String,
      default: "",
    },

    stripeSubscriptionId: {
      type: String,
      default: "",
    },

    autoCharge: {
      type: Boolean,
      default: true,
    },

    lineItems: {
      type: [lineItemSchema],
      required: true,
      default: [],
    },

    taxRate: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);


subscriptionSchema.pre("validate", function () {

  if (this.tenantId) {
    this.organization = this.tenantId;
  } else if (this.organization) {
    this.tenantId = this.organization;
  }


  if (this.clientId) {
    this.client = this.clientId;
  } else if (this.client) {
    this.clientId = this.client;
  }
});

subscriptionSchema.index({ tenantId: 1, status: 1 });
subscriptionSchema.index({ tenantId: 1, clientId: 1 });
subscriptionSchema.index({ nextBillingDate: 1, status: 1 });

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
