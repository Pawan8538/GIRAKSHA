import api from '../lib/api';

export const messageService = {
    // Get all conversations for the current user
    getConversations: async () => {
        const response = await api.get('/messages/conversations');
        return response.data.data;
    },

    // Get available participants to start a conversation with
    getParticipants: async () => {
        const response = await api.get('/messages/participants');
        return response.data.data;
    },

    // Start a new conversation or get existing one
    startConversation: async (participantId) => {
        const response = await api.post('/messages/conversations', { participantId });
        return response.data.data;
    },

    // Get messages for a specific conversation
    getMessages: async (conversationId) => {
        const response = await api.get(`/messages/conversations/${conversationId}/messages`);
        return response.data.data;
    },

    // Send a message
    sendMessage: async (conversationId, body, attachments = []) => {
        const response = await api.post(`/messages/conversations/${conversationId}/messages`, {
            body,
            attachments
        });
        return response.data.data;
    }
};
