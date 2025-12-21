const {
  findConversation,
  createConversation,
  getConversationById,
  getConversationsForUser,
  createConversationMessage,
  getConversationMessages,
  markConversationMessagesRead,
  touchConversation,
  getUsersByRole,
  getUserById
} = require('../models/queries');
const { notifyUser } = require('../services/notification.service');

const ensureConversationAccess = (conversation, userId) => {
  return (
    conversation &&
    (conversation.gov_user_id === Number(userId) ||
      conversation.site_admin_id === Number(userId) ||
      conversation.super_admin_id === Number(userId))
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
    const currentUserRole = req.user.role_name;
    const rolesToFetch = [];

    // Everyone sees everyone else, basically
    // Super Admin <-> Site Admin
    // Super Admin <-> Gov Authority
    // Site Admin <-> Gov Authority

    if (currentUserRole === 'super_admin') {
      rolesToFetch.push('site_admin', 'gov_authority');
    } else if (currentUserRole === 'site_admin') {
      rolesToFetch.push('super_admin', 'gov_authority');
    } else if (currentUserRole === 'gov_authority') {
      rolesToFetch.push('super_admin', 'site_admin');
    } else {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let allUsers = [];
    for (const role of rolesToFetch) {
      const result = await getUsersByRole(role);
      allUsers = [...allUsers, ...result.rows];
    }

    return res.json({
      success: true,
      data: allUsers.map((user) => ({
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
    const { id: currentUserId, role_name: currentUserRole } = req.user;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant id is required'
      });
    }

    // Determine roles
    const participantRes = await getUserById(participantId);
    if (participantRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const participant = participantRes.rows[0];
    const participantRole = participant.role_name; // We need getting role name from getUserById result? 
    // getUserById joins roles? Check queries.js: "SELECT u.*, r.name as role_name FROM users u JOIN roles r..."

    // Actually typically getUserById just returns users u.*. 
    // Wait, let me check getUserById query. It typically does NOT join role name unless specified.
    // queries.js check: `SELECT * FROM users WHERE id = $1` usually. 
    // I need role name. 
    // I will fetch role separately? Or assume getUserById returns it?
    // Let's assume I need to fetch it properly. 
    // Actually, I can infer columns. 
    // To be safe, I'll rely on the participant fetching logic which I know works (listParticipants uses getUsersByRole which joins).

    // Re-check getUserById in queries.js
    // It is `SELECT * FROM users WHERE id = $1`.
    // It DOES NOT return role_name, only role_id.
    // I need to know the role to map to correct column.

    // I will fetch role by role_id.
    const { getRoleById } = require('../models/queries');
    const roleRes = await getRoleById(participant.role_id);
    const pRoleName = roleRes.rows[0].name;

    let govUserId = null;
    let siteAdminId = null;
    let superAdminId = null;

    const assignUser = (userId, role) => {
      if (role === 'gov_authority') govUserId = userId;
      else if (role === 'site_admin') siteAdminId = userId;
      else if (role === 'super_admin') superAdminId = userId;
    };

    assignUser(currentUserId, currentUserRole);
    assignUser(participantId, pRoleName);

    let conversation = await findConversation(currentUserId, participantId);
    if (conversation.rowCount === 0) {
      conversation = await createConversation(govUserId, siteAdminId, superAdminId, currentUserId);
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

    // Push whoever is NOT me
    if (convo.gov_user_id && convo.gov_user_id !== req.user.id) receivers.push(convo.gov_user_id);
    if (convo.site_admin_id && convo.site_admin_id !== req.user.id) receivers.push(convo.site_admin_id);
    if (convo.super_admin_id && convo.super_admin_id !== req.user.id) receivers.push(convo.super_admin_id);

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

