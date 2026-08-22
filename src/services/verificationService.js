import apiClient from '../api/client';

export const verificationService = {
  /**
   * Get authenticated user's verification status and history.
   */
  async getMyVerificationStatus() {
    const response = await apiClient.get('/verifications/me');
    return response.data;
  },

  /**
   * Submit verification documents. Supports FormData.
   */
  async submitVerification(data) {
    const isFormData = data instanceof FormData;
    const response = await apiClient.post('/verifications', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },
};
