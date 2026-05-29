import AuditLog from "../models/auditLog.model.js";

class AuditService {









  async logAction(organizationId, userId, action, details = {}, ipAddress = "", userAgent = "") {
    try {
      await AuditLog.create({
        organization: organizationId,
        user: userId,
        action,
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
