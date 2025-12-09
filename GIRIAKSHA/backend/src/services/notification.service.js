const {
  createNotification,
  enqueueNotification
} = require('../models/queries');

const buildPayload = (notificationRow) => ({
  id: notificationRow.id,
  user_id: notificationRow.user_id,
  type: notificationRow.type,
  title: notificationRow.title,
  body: notificationRow.body,
  metadata: notificationRow.metadata || {},
  is_read: notificationRow.is_read,
  created_at: notificationRow.created_at
});

const notifyUser = async (app, { userId, type, title, body, metadata = {} }) => {
  const notificationResult = await createNotification(userId, type, title, body, metadata);
  const notification = notificationResult.rows[0];
  const payload = buildPayload(notification);

  const io = app.get('io');
  const onlineUsers = app.get('onlineUsers');
  const room = `user:${userId}`;
  const isOnline = onlineUsers && onlineUsers.has(String(userId));

  if (io && isOnline) {
    io.to(room).emit('notification', payload);
  } else {
    await enqueueNotification(notification.id, userId);
    // Placeholder for SMS/email integration
    console.warn(`[notification] User ${userId} offline. Notification queued.`);
  }

  return payload;
};

const notifyUsers = async (app, userIds = [], payload) => {
  return Promise.all(
    userIds.map((userId) =>
      notifyUser(app, { userId, ...payload })
    )
  );
};

module.exports = {
  notifyUser,
  notifyUsers
};

