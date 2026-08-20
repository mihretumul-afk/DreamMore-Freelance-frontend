import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import apiClient from '../../api/client';
import { credentialService } from '../credentialService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('credentialService', () => {
  describe('getMyCredentials', () => {
    it('calls GET /credentials with default params', async () => {
      const mockData = { success: true, data: [{ id: 1, title: 'Cert' }] };
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await credentialService.getMyCredentials();

      expect(apiClient.get).toHaveBeenCalledWith('/credentials', { params: {} });
      expect(result).toEqual(mockData);
    });

    it('passes filter params through', async () => {
      apiClient.get.mockResolvedValue({ data: { data: [] } });

      await credentialService.getMyCredentials({ status: 'pending', type: 'external_certificate' });

      expect(apiClient.get).toHaveBeenCalledWith('/credentials', {
        params: { status: 'pending', type: 'external_certificate' },
      });
    });
  });

  describe('createCredential', () => {
    it('calls POST /credentials with multipart/form-data header', async () => {
      const formData = new FormData();
      formData.append('title', 'Web Dev Cert');
      formData.append('type', 'dream_more_certificate');

      const mockResponse = { success: true, data: { id: 1, title: 'Web Dev Cert', status: 'pending' } };
      apiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await credentialService.createCredential(formData);

      expect(apiClient.post).toHaveBeenCalledWith('/credentials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCredential', () => {
    it('calls GET /credentials/:id', async () => {
      const mockData = { success: true, data: { id: 5, title: 'My Cert' } };
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await credentialService.getCredential(5);

      expect(apiClient.get).toHaveBeenCalledWith('/credentials/5');
      expect(result).toEqual(mockData);
    });
  });

  describe('deleteCredential', () => {
    it('calls DELETE /credentials/:id', async () => {
      apiClient.delete.mockResolvedValue({ data: { success: true } });

      const result = await credentialService.deleteCredential(3);

      expect(apiClient.delete).toHaveBeenCalledWith('/credentials/3');
      expect(result).toEqual({ success: true });
    });
  });

  describe('downloadCredential', () => {
    it('calls GET /credentials/:id/download with blob responseType', async () => {
      const mockResponse = { data: new Blob(['file content']) };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await credentialService.downloadCredential(7);

      expect(apiClient.get).toHaveBeenCalledWith('/credentials/7/download', {
        responseType: 'blob',
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('getPublicCredentials', () => {
    it('calls GET /freelancers/:userId/credentials', async () => {
      const mockData = {
        success: true,
        data: [{ id: 1, title: 'Verified Cert', type: 'dream_more_certificate' }],
      };
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await credentialService.getPublicCredentials(42);

      expect(apiClient.get).toHaveBeenCalledWith('/freelancers/42/credentials');
      expect(result).toEqual(mockData);
    });
  });

  describe('error handling', () => {
    it('propagates errors from the API client', async () => {
      const error = new Error('Network Error');
      apiClient.get.mockRejectedValue(error);

      await expect(credentialService.getMyCredentials()).rejects.toThrow('Network Error');
    });

    it('propagates validation errors from create', async () => {
      const error = {
        response: {
          status: 422,
          data: { errors: { title: ['Title is required'] } },
        },
      };
      apiClient.post.mockRejectedValue(error);

      await expect(credentialService.createCredential(new FormData())).rejects.toEqual(error);
    });
  });
});
