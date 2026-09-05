import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../api/client';
import { authService } from '../authService';

vi.mock('../../api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('authService - Password Reset Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('forgotPassword', () => {
    it('sends POST /auth/forgot-password with user email', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Password reset link sent. Please check your email.',
        },
      };
      apiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.forgotPassword('user@example.com');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'user@example.com',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('resetPassword', () => {
    it('sends POST /auth/reset-password with token, email, and passwords', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Password reset successfully.',
        },
      };
      apiClient.post.mockResolvedValue(mockResponse);

      const payload = {
        token: 'sample-token-123',
        email: 'user@example.com',
        password: 'newpassword123',
        password_confirmation: 'newpassword123',
      };

      const result = await authService.resetPassword(payload);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', payload);
      expect(result).toEqual(mockResponse.data);
    });
  });
});
