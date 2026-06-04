import AuditLog from "../models/auditLog.model.js";
import mongoose from "mongoose";

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
        resourceId: details.resourceId || details.clientId || details.invoiceId || new mongoose.Types.ObjectId(),
        details,
        ipAddress,
        userAgent,
      });
    } catch (_) {}
  }

  async getAuditLogs(organizationId, query = {}) {
    const limit = Math.min(parseInt(query.limit) || 50, 200);
    const skip = parseInt(query.skip) || 0;
    const filter = { organization: organizationId };
    if (query.action) filter.action = { $regex: query.action, $options: "i" };
    if (query.userId) filter.userId = query.userId;
    return AuditLog.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }
}

export default new AuditService();
