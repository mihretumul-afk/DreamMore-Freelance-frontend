import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import apiClient from '../../api/client';
import { messageService } from '../messageService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('messageService', () => {
  describe('getConversations', () => {
    it('calls GET /messages/conversations', async () => {
      const mockData = {
        success: true,
        data: [
          {
            partner: { id: 2, name: 'John', avatar: null },
            last_message: { id: 10, content: 'Hello', sender_id: 1, created_at: '2026-01-01T00:00:00Z' },
            unread_count: 2,
          },
        ],
      };
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await messageService.getConversations();

      expect(apiClient.get).toHaveBeenCalledWith('/messages/conversations');
      expect(result).toEqual(mockData);
    });

    it('returns empty array when no conversations', async () => {
      apiClient.get.mockResolvedValue({ data: { success: true, data: [] } });

      const result = await messageService.getConversations();

      expect(result.data).toEqual([]);
    });
  });

  describe('getMessages', () => {
    it('calls GET /messages/:userId', async () => {
      const mockData = {
        success: true,
        data: [
          { id: 1, content: 'Hi there', sender_id: 2, receiver_id: 1 },
          { id: 2, content: 'Hello!', sender_id: 1, receiver_id: 2 },
        ],
      };
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await messageService.getMessages(42);

      expect(apiClient.get).toHaveBeenCalledWith('/messages/42', { params: {} });
      expect(result).toEqual(mockData);
    });

    it('passes pagination params', async () => {
      apiClient.get.mockResolvedValue({ data: { data: [] } });

      await messageService.getMessages(5, { page: 2 });

      expect(apiClient.get).toHaveBeenCalledWith('/messages/5', { params: { page: 2 } });
    });
  });

  describe('sendMessage', () => {
    it('calls POST /messages with payload', async () => {
      const payload = { receiver_id: 42, content: 'Project update' };
      const mockResponse = {
        success: true,
        data: { id: 99, ...payload, sender_id: 1, created_at: '2026-01-01T00:00:00Z' },
      };
      apiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await messageService.sendMessage(payload);

      expect(apiClient.post).toHaveBeenCalledWith('/messages', payload);
      expect(result).toEqual(mockResponse);
    });

    it('sends with contract_id when provided', async () => {
      const payload = { receiver_id: 42, content: 'Update', contract_id: 7 };
      apiClient.post.mockResolvedValue({ data: { success: true, data: { id: 1 } } });

      await messageService.sendMessage(payload);

      expect(apiClient.post).toHaveBeenCalledWith('/messages', payload);
    });
  });

  describe('markAsRead', () => {
    it('calls PUT /messages/:messageId/read', async () => {
      apiClient.put.mockResolvedValue({ data: { success: true } });

      const result = await messageService.markAsRead(15);

      expect(apiClient.put).toHaveBeenCalledWith('/messages/15/read');
      expect(result).toEqual({ success: true });
    });
  });

  describe('markAllAsRead', () => {
    it('calls PUT /messages/:userId/read-all', async () => {
      apiClient.put.mockResolvedValue({ data: { success: true } });

      const result = await messageService.markAllAsRead(42);

      expect(apiClient.put).toHaveBeenCalledWith('/messages/42/read-all');
      expect(result).toEqual({ success: true });
    });
  });

  describe('getUnreadCount', () => {
    it('calls GET /messages/unread', async () => {
      const mockData = { success: true, data: { unread_count: 5 } };
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await messageService.getUnreadCount();

      expect(apiClient.get).toHaveBeenCalledWith('/messages/unread');
      expect(result).toEqual(mockData);
    });
  });

  describe('error handling', () => {
    it('propagates errors from API client', async () => {
      const error = new Error('Request failed');
      apiClient.get.mockRejectedValue(error);

      await expect(messageService.getConversations()).rejects.toThrow('Request failed');
    });

    it('propagates 403 forbidden errors', async () => {
      const error = {
        response: { status: 403, data: { success: false, message: 'Forbidden' } },
      };
      apiClient.post.mockRejectedValue(error);

      await expect(messageService.sendMessage({ receiver_id: 99, content: 'spam' })).rejects.toEqual(error);
    });

    it('propagates 401 unauthorized errors', async () => {
      const error = {
        response: { status: 401, data: { success: false, message: 'Unauthenticated' } },
      };
      apiClient.get.mockRejectedValue(error);

      await expect(messageService.getUnreadCount()).rejects.toEqual(error);
    });
  });
});
