import mongoose from "mongoose";

const approvalHistorySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ["approved", "rejected"],
    required: true,
  },
  actedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  notes: {
    type: String,
    default: "",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

const joinRequestSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: ["member", "read_only"],
      required: true,
    },

    message: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    approvalHistory: [approvalHistorySchema],
  },
  {
    timestamps: true,
  }
);

joinRequestSchema.index({ organization: 1, status: 1 });
joinRequestSchema.index({ user: 1 });

const JoinRequest = mongoose.model("JoinRequest", joinRequestSchema);

export default JoinRequest;
