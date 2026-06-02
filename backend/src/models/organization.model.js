import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    logo: {
      type: String,
      default: "",
    },


    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },


    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    plan: {
      type: String,
      enum: ["free", "starter", "pro", "enterprise", "business"],
      default: "free",
    },

    currency: {
      type: String,
      default: "INR",
    },

    country: {
      type: String,
      default: "IN",
    },

    taxId: {
      type: String,
      default: "",
    },

    stripeCustomerId: {
      type: String,
      default: "",
    },

    apiKeys: [
      {
        key: String,
        label: String,
        createdAt: Date,
        lastUsed: Date,
      },
    ],

    settings: {
      invoicePrefix: { type: String, default: "INV" },
      locale: { type: String, default: "en-IN" },
      timezone: { type: String, default: "Asia/Kolkata" },
      darkMode: { type: Boolean, default: false },
    },

    accessCode: {
      type: String,
      unique: true,
      sparse: true,
      default: () => "ORG-" + Math.random().toString(36).substr(2, 6).toUpperCase()
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);


organizationSchema.pre("validate", function () {
  if (this.ownerUserId) {
    this.owner = this.ownerUserId;
    this.userId = this.ownerUserId;
  } else if (this.owner) {
    this.ownerUserId = this.owner;
    this.userId = this.owner;
  } else if (this.userId) {
    this.ownerUserId = this.userId;
    this.owner = this.userId;
  }
});

organizationSchema.index({ ownerUserId: 1 });

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;