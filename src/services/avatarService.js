import apiClient from '../api/client';

/**
 * Avatar service — handles profile photo uploads and removal.
 *
 * Endpoints:
 *   POST   /avatar   upload or replace the authenticated user's profile photo
 *   DELETE /avatar    remove the authenticated user's profile photo
 */
export const avatarService = {
  /**
   * Upload or replace the authenticated user's profile photo.
   * @param {File} file - The image file to upload
   * @returns {Promise<Object>} - { success, data: { avatar, user } }
   */
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post('/avatar', formData);
    return response.data;
  },

  /**
   * Remove the authenticated user's profile photo.
   * @returns {Promise<Object>} - { success, data: { avatar: null, user } }
   */
  async removeAvatar() {
    const response = await apiClient.delete('/avatar');
    return response.data;
  },
};

export default avatarService;
