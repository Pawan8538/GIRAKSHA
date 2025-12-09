const express = require('express');

const notificationsController = require('../controllers/notifications.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, notificationsController.listNotifications);
router.post('/mark-all', requireAuth, notificationsController.markAll);
router.post('/:notificationId/read', requireAuth, notificationsController.markNotification);

module.exports = router;

