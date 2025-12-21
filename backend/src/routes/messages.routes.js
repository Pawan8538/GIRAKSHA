const express = require('express');

const messagesController = require('../controllers/messages.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const messagingAccess = [requireAuth, requireRole('GOV_AUTHORITY', 'SITE_ADMIN', 'SUPER_ADMIN')];

router.get('/conversations', ...messagingAccess, messagesController.listConversations);
router.post('/conversations', ...messagingAccess, messagesController.startConversation);
router.get('/participants', ...messagingAccess, messagesController.listParticipants);
router.get(
  '/conversations/:conversationId/messages',
  ...messagingAccess,
  messagesController.fetchConversationMessages
);
router.post(
  '/conversations/:conversationId/messages',
  ...messagingAccess,
  messagesController.sendMessage
);

module.exports = router;

