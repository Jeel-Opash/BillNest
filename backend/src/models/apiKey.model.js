import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    key: {
      type: String,
      required: true,
      unique: true,
    },

    keyHash: {
      type: String,
      unique: true,
      sparse: true,
    },

    last4: {
      type: String,
      default: "",
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    rateLimit: {
      type: Number,
      default: 100,
    },

    revokedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

apiKeySchema.pre("validate", function () {
  if (this.tenantId) {
    this.organization = this.tenantId;
  } else if (this.organization) {
    this.tenantId = this.organization;
  }

  if (this.key && !this.keyHash) {
    this.keyHash = this.key;
  } else if (this.keyHash && !this.key) {
    this.key = this.keyHash;
  }
});

apiKeySchema.index({ organization: 1 });

const ApiKey = mongoose.model("ApiKey", apiKeySchema);

export default ApiKey;
