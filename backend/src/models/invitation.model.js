import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["admin", "member", "read-only", "read_only"],
      required: true,
    },

    clientAccess: [
      {
        clientId: { type: String },
        clientName: { type: String },
        role: { type: String, enum: ["admin", "member", "viewer", "none"], default: "none" }
      }
    ],

    token: {
      type: String,
      required: true,
      unique: true,
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

invitationSchema.index({ organization: 1, email: 1 });

const Invitation = mongoose.model("Invitation", invitationSchema);

export default Invitation;
