import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

import apiClient from '../../api/client';
import { notificationService } from '../notificationService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('notificationService', () => {
  describe('getNotifications', () => {
    it('calls GET /notifications with default params', async () => {
      const mockData = {
        success: true,
        data: [
          { id: 1, type: 'new_proposal', title: 'New Proposal', message: 'You have a new proposal.', read_at: null },
        ],
      };
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await notificationService.getNotifications();

      expect(apiClient.get).toHaveBeenCalledWith('/notifications', { params: {} });
      expect(result).toEqual(mockData);
    });

    it('passes filter params', async () => {
      apiClient.get.mockResolvedValue({ data: { data: [] } });

      await notificationService.getNotifications({ read: 'false' });

      expect(apiClient.get).toHaveBeenCalledWith('/notifications', {
        params: { read: 'false' },
      });
    });

    it('returns empty data when no notifications', async () => {
      apiClient.get.mockResolvedValue({ data: { success: true, data: [] } });

      const result = await notificationService.getNotifications();

      expect(result.data).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    it('calls PUT /notifications/:notificationId/read', async () => {
      const mockResponse = {
        success: true,
        data: { id: 5, read_at: '2026-08-19T12:00:00Z' },
      };
      apiClient.put.mockResolvedValue({ data: mockResponse });

      const result = await notificationService.markAsRead(5);

      expect(apiClient.put).toHaveBeenCalledWith('/notifications/5/read');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('markAllAsRead', () => {
    it('calls PUT /notifications/read-all', async () => {
      apiClient.put.mockResolvedValue({ data: { success: true } });

      const result = await notificationService.markAllAsRead();

      expect(apiClient.put).toHaveBeenCalledWith('/notifications/read-all');
      expect(result).toEqual({ success: true });
    });
  });

  describe('getUnreadCount', () => {
    it('calls GET /notifications/unread', async () => {
      const mockData = { success: true, data: { unread_count: 3 } };
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await notificationService.getUnreadCount();

      expect(apiClient.get).toHaveBeenCalledWith('/notifications/unread');
      expect(result).toEqual(mockData);
    });

    it('returns zero when no unread notifications', async () => {
      apiClient.get.mockResolvedValue({ data: { success: true, data: { unread_count: 0 } } });

      const result = await notificationService.getUnreadCount();

      expect(result.data.unread_count).toBe(0);
    });
  });

  describe('error handling', () => {
    it('propagates network errors', async () => {
      const error = new Error('Network Error');
      apiClient.get.mockRejectedValue(error);

      await expect(notificationService.getNotifications()).rejects.toThrow('Network Error');
    });

    it('propagates 401 unauthorized errors', async () => {
      const error = {
        response: { status: 401, data: { success: false, message: 'Unauthenticated' } },
      };
      apiClient.get.mockRejectedValue(error);

      await expect(notificationService.getUnreadCount()).rejects.toEqual(error);
    });

    it('propagates server errors', async () => {
      const error = {
        response: { status: 500, data: { success: false, message: 'Server Error' } },
      };
      apiClient.put.mockRejectedValue(error);

      await expect(notificationService.markAllAsRead()).rejects.toEqual(error);
    });
  });

  describe('method signatures', () => {
    it('getNotifications accepts empty params', async () => {
      apiClient.get.mockResolvedValue({ data: { data: [] } });

      await notificationService.getNotifications();

      expect(apiClient.get).toHaveBeenCalledWith('/notifications', { params: {} });
    });

    it('markAsRead accepts numeric ID', async () => {
      apiClient.put.mockResolvedValue({ data: { success: true } });

      await notificationService.markAsRead(42);

      expect(apiClient.put).toHaveBeenCalledWith('/notifications/42/read');
    });

    it('markAsRead accepts string ID', async () => {
      apiClient.put.mockResolvedValue({ data: { success: true } });

      await notificationService.markAsRead('abc-123');

      expect(apiClient.put).toHaveBeenCalledWith('/notifications/abc-123/read');
    });
  });
});
