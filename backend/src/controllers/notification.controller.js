import NotificationService from "../services/notification.service.js";

export const getNotifications = async (req, res) => {
  try {
    const list = await NotificationService.listNotifications(req.user.organizationId, req.query);
    res.status(200).json({
      success: true,
      notifications: list,
    });
  } catch (error) {
    console.error("Get Notifications Controller Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const updated = await NotificationService.markAsRead(req.user.organizationId, req.params.id);
    res.status(200).json({
      success: true,
      notification: updated,
    });
  } catch (error) {
    console.error("Mark Notification Read Controller Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await NotificationService.markAllAsRead(req.user.organizationId);
    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark All Read Controller Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
