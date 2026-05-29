import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    key: {
      type: String,
      required: true,
      unique: true,
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
  },
  {
    timestamps: true,
  }
);

apiKeySchema.index({ organization: 1 });

const ApiKey = mongoose.model("ApiKey", apiKeySchema);

export default ApiKey;
