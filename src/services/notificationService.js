import apiClient from '../api/client';

/**
 * Notification service — manages user notifications.
 *
 * Endpoints:
 *   GET  /notifications                    list notifications
 *   PUT  /notifications/:notificationId/read  mark as read
 *   PUT  /notifications/read-all           mark all as read
 *   GET  /notifications/unread             unread count
 */
export const notificationService = {
  /** List notifications for the authenticated user. */
  getNotifications: async (params = {}) => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  /** Mark a specific notification as read. */
  markAsRead: async (notificationId) => {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /** Mark all notifications as read. */
  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },

  /** Get unread notification count. */
  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread');
    return response.data;
  },

  /** Permanently delete a specific notification. */
  deleteNotification: async (notificationId) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

export default notificationService;
