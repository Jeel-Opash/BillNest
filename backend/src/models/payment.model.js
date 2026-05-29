import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
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

    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
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

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      required: true,
      default: "INR",
    },

    method: {
      type: String,
      enum: ["stripe", "bank_transfer", "cash", "cheque", "other"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
    },

    stripePaymentIntentId: {
      type: String,
      default: "",
    },

    stripeChargeId: {
      type: String,
      default: "",
    },

    failureReason: {
      type: String,
      default: "",
    },

    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },

    paidAt: {
      type: Date,
    },

    refundedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);


paymentSchema.pre("validate", function () {

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

paymentSchema.index({ tenantId: 1, invoiceId: 1 });
paymentSchema.index({ idempotencyKey: 1 }, { unique: true });
paymentSchema.index({ stripePaymentIntentId: 1 }, { sparse: true });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
