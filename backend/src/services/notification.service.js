import Notification from "../models/notification.model.js";

class NotificationService {
  async createNotification(organizationId, title, message, type = "SYSTEM_ALERT", userId = null) {
    try {
      return await Notification.create({
        organization: organizationId,
        tenantId: organizationId,
        user: userId,
        title,
        message,
        type,
        isRead: false
      });
    } catch (error) {
      console.error("Failed to create notification:", error);
    }
  }

  async listNotifications(organizationId, query = {}) {
    const limit = parseInt(query.limit) || 50;
    const skip = parseInt(query.skip) || 0;
    const filter = { organization: organizationId };
    
    if (query.isRead !== undefined) {
      filter.isRead = query.isRead === "true";
    }

    return await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async markAsRead(organizationId, id) {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { isRead: true },
      { new: true }
    );
    if (!notification) throw new Error("Notification not found or access denied");
    return notification;
  }

  async markAllAsRead(organizationId) {
    return await Notification.updateMany(
      { organization: organizationId, isRead: false },
      { isRead: true }
    );
  }
}

export default new NotificationService();
