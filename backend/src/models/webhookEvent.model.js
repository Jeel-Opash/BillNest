import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
      expires: 2592000,
    },
  },
  {
    timestamps: true,
  }
);

const WebhookEvent = mongoose.model("WebhookEvent", webhookEventSchema);

export default WebhookEvent;
