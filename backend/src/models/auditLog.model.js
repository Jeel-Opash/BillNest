import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
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


    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },


    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userEmail: {
      type: String,
      required: true,
    },

    action: {
      type: String,
      required: true,
    },

    resourceType: {
      type: String,
      required: true,
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    previousValue: {
      type: mongoose.Schema.Types.Mixed,
    },

    newValue: {
      type: mongoose.Schema.Types.Mixed,
    },

    ipAddress: {
      type: String,
      default: "",
    },

    userAgent: {
      type: String,
      default: "",
    },


    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);


auditLogSchema.pre("validate", function () {

  if (this.tenantId) {
    this.organization = this.tenantId;
  } else if (this.organization) {
    this.tenantId = this.organization;
  }


  if (this.userId) {
    this.user = this.userId;
  } else if (this.user) {
    this.userId = this.user;
  }


  if (!this.userEmail) {
    this.userEmail = "system@billnest.com";
  }


  if (!this.resourceType) {
    this.resourceType = "other";
  }
  if (!this.resourceId) {
    this.resourceId = new mongoose.Types.ObjectId();
  }
});


auditLogSchema.pre("findOneAndUpdate", function () {
  throw new Error("AuditLog is immutable — updates are not allowed");
});

auditLogSchema.index({ tenantId: 1, createdAt: -1 });
auditLogSchema.index({ tenantId: 1, resourceType: 1, resourceId: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
