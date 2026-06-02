import AuditLog from "../models/auditLog.model.js";

class AuditService {









  async logAction(organizationId, userId, action, details = {}, ipAddress = "", userAgent = "") {
    try {
      await AuditLog.create({
        tenantId: organizationId,
        organization: organizationId,
        userId: userId,
        user: userId,
        userEmail: "system@billnest.com",
        action,
        resourceType: details.resourceType || action.split("_")[0].toLowerCase() || "other",
        resourceId: details.resourceId || details.clientId || details.invoiceId || new (await import("mongoose")).default.Types.ObjectId(),
        details,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      console.error("Failed to log audit action:", error);
    }
  }






  async getAuditLogs(organizationId, query = {}) {
    const limit = parseInt(query.limit) || 50;
    const skip = parseInt(query.skip) || 0;

    return await AuditLog.find({ organization: organizationId })
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }
}

export default new AuditService();
