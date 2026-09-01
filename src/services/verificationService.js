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
    const response = await apiClient.post('/verifications', data);
    return response.data;
  },
};
