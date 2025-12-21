const {
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead
} = require('../models/queries');

const listNotifications = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    // For admins, show all notifications (including system-wide)
    // For regular users, show only user-specific notifications
    const userRole = req.user.role_name || req.user.role;
    const isAdmin = userRole === 'super_admin' || userRole === 'site_admin' || userRole === 'gov_authority';

    let result;
    if (isAdmin) {
      // Admins see ALL notifications OR notifications targeted to them
      const { query } = require('../models/db');
      result = await query(
        `SELECT * FROM notifications
         WHERE user_id = $1 OR user_id IS NULL OR type IN ('system', 'alert', 'sos', 'advisory')
         ORDER BY created_at DESC
         LIMIT $2`,
        [req.user.id, limit]
      );
    } else {
      // Regular users see only their own notifications
      result = await getNotificationsForUser(req.user.id, limit);
    }

    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

const markNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const updated = await markNotificationRead(notificationId, req.user.id);
    if (updated.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    return res.json({
      success: true,
      data: updated.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const markAll = async (req, res, next) => {
  try {
    await markAllNotificationsRead(req.user.id);
    return res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listNotifications,
  markNotification,
  markAll
};

