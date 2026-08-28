import apiClient from '../api/client';

/**
 * Credential service — manages freelancer professional documents and certificates.
 *
 * Endpoints:
 *   GET  /credentials           list own credentials
 *   POST /credentials           submit a new credential (multipart/form-data)
 *   GET  /credentials/:id       view own credential detail
 *   DELETE /credentials/:id     delete own pending credential
 *   GET  /freelancers/:id/credentials  public verified credentials
 */
export const credentialService = {
  /** List the authenticated freelancer's credentials. */
  getMyCredentials: async (params = {}) => {
    const response = await apiClient.get('/credentials', { params });
    return response.data;
  },

  /** Submit a new credential with file upload. */
  createCredential: async (payload) => {
    const isFormData = payload instanceof FormData;
    const response = await apiClient.post('/credentials', payload, isFormData ? {
      headers: { 'Content-Type': undefined },
    } : {});
    return response.data;
  },

  /** View a single credential detail. */
  getCredential: async (id) => {
    const response = await apiClient.get(`/credentials/${id}`);
    return response.data;
  },

  /** Update an existing credential. */
  updateCredential: async (id, payload) => {
    if (payload instanceof FormData) {
      payload.append('_method', 'PUT');
      const response = await apiClient.post(`/credentials/${id}`, payload, {
        headers: { 'Content-Type': undefined },
      });
      return response.data;
    }
    const response = await apiClient.put(`/credentials/${id}`, payload);
    return response.data;
  },

  /** Delete a pending credential. */
  deleteCredential: async (id) => {
    const response = await apiClient.delete(`/credentials/${id}`);
    return response.data;
  },

  /** Download a credential file. */
  downloadCredential: async (id) => {
    const response = await apiClient.get(`/credentials/${id}/download`, {
      responseType: 'blob',
    });
    return response;
  },

  /** Get verified credentials for a freelancer's public profile. */
  getPublicCredentials: async (userId) => {
    const response = await apiClient.get(`/freelancers/${userId}/credentials`);
    return response.data;
  },
};

export default credentialService;
