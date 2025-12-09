const {
  findConversation,
  createConversation,
  getConversationById,
  getConversationsForUser,
  createConversationMessage,
  getConversationMessages,
  markConversationMessagesRead,
  touchConversation,
  getUsersByRole
} = require('../models/queries');
const { notifyUser } = require('../services/notification.service');

const ensureConversationAccess = (conversation, userId) => {
  return (
    conversation &&
    (conversation.gov_user_id === Number(userId) ||
      conversation.site_admin_id === Number(userId))
  );
};

const listConversations = async (req, res, next) => {
  try {
    const conversations = await getConversationsForUser(req.user.id);
    return res.json({
      success: true,
      data: conversations.rows
    });
  } catch (error) {
    next(error);
  }
};

const listParticipants = async (req, res, next) => {
  try {
    let targetRole = null;
    if (['gov_authority', 'super_admin'].includes(req.user.role_name)) {
      targetRole = 'site_admin';
    } else if (req.user.role_name === 'site_admin') {
      targetRole = 'gov_authority';
    }

    if (!targetRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const users = await getUsersByRole(targetRole);
    return res.json({
      success: true,
      data: users.rows.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role_name: user.role_name
      }))
    });
  } catch (error) {
    next(error);
  }
};

const startConversation = async (req, res, next) => {
  try {
    const { participantId } = req.body;
    const { role_name, id } = req.user;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant id is required'
      });
    }

    if (!['gov_authority', 'site_admin', 'super_admin'].includes(role_name)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const govUserId = role_name === 'gov_authority' ? id : participantId;
    const siteAdminId = role_name === 'gov_authority' ? participantId : id;

    let conversation = await findConversation(govUserId, siteAdminId);
    if (conversation.rowCount === 0) {
      conversation = await createConversation(govUserId, siteAdminId, id);
    }

    return res.status(201).json({
      success: true,
      data: conversation.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const fetchConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const conversation = await getConversationById(conversationId);

    if (conversation.rowCount === 0 || !ensureConversationAccess(conversation.rows[0], req.user.id)) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    await markConversationMessagesRead(conversationId, req.user.id);
    const messages = await getConversationMessages(conversationId, 200);
    return res.json({
      success: true,
      data: messages.rows.reverse()
    });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { body, attachments = [] } = req.body;

    if (!body && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Message body or attachment required'
      });
    }

    const conversation = await getConversationById(conversationId);
    if (conversation.rowCount === 0 || !ensureConversationAccess(conversation.rows[0], req.user.id)) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const created = await createConversationMessage(
      conversationId,
      req.user.id,
      body,
      attachments
    );
    await touchConversation(conversationId);

    const message = created.rows[0];
    const io = req.app.get('io');

    const payload = {
      ...message,
      sender_id: req.user.id,
      sender_name: req.user.name,
      created_at: message.created_at
    };

    const receivers = [];
    const convo = conversation.rows[0];
    if (req.user.id !== convo.gov_user_id) {
      receivers.push(convo.gov_user_id);
    }
    if (req.user.id !== convo.site_admin_id) {
      receivers.push(convo.site_admin_id);
    }

    for (const receiverId of receivers) {
      if (io) {
        io.to(`user:${receiverId}`).emit('message:new', payload);
      }
      await notifyUser(req.app, {
        userId: receiverId,
        type: 'message',
        title: 'New message',
        body: body || 'New attachment received',
        metadata: {
          conversationId,
          senderId: req.user.id
        }
      });
    }

    return res.status(201).json({
      success: true,
      data: payload
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listConversations,
  startConversation,
  fetchConversationMessages,
  sendMessage,
  listParticipants
};

