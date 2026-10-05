import apiClient from '../api/client';

/**
 * Message service — manages conversations and messages between contract participants.
 *
 * Endpoints:
 *   GET  /messages/conversations       list conversations
 *   GET  /messages/:userId             messages in a conversation
 *   POST /messages                     send a message
 *   PUT  /messages/:messageId/read     mark message as read
 *   PUT  /messages/:userId/read-all    mark all messages as read
 *   GET  /messages/unread              unread count
 */
export const messageService = {
  /** List conversations with partners. */
  getConversations: async () => {
    const response = await apiClient.get('/messages/conversations');
    return response.data;
  },

  /** Get messages in a conversation with a specific user. */
  getMessages: async (userId, params = {}) => {
    const response = await apiClient.get(`/messages/${userId}`, { params });
    return response.data;
  },

  /** Send a message to a user. */
  sendMessage: async (payload) => {
    const response = await apiClient.post('/messages', payload);
    return response.data;
  },

  /** Mark a specific message as read. */
  markAsRead: async (messageId) => {
    const response = await apiClient.put(`/messages/${messageId}/read`);
    return response.data;
  },

  /** Mark all messages in a conversation as read. */
  markAllAsRead: async (userId) => {
    const response = await apiClient.put(`/messages/${userId}/read-all`);
    return response.data;
  },

  /** Get unread message count. */
  getUnreadCount: async () => {
    const response = await apiClient.get('/messages/unread');
    return response.data;
  },

  /** Send WebRTC call signal. */
  sendCallSignal: async (payload) => {
    const response = await apiClient.post('/messages/call/signal', payload);
    return response.data;
  },
};

export default messageService;
