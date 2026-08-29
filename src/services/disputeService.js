import apiClient from '../api/client';

/**
 * Dispute service — manages user-facing dispute views and replies.
 */
export const disputeService = {
  /** GET /disputes — list user's disputes */
  getDisputes: async (params = {}) => {
    const response = await apiClient.get('/disputes', { params });
    return response.data;
  },

  /** GET /disputes/:id — single dispute details */
  getDispute: async (id) => {
    const response = await apiClient.get(`/disputes/${id}`);
    return response.data;
  },

  /** POST /disputes/:id/notes — add note/reply to dispute */
  addNote: async (id, note) => {
    const response = await apiClient.post(`/disputes/${id}/notes`, { note });
    return response.data;
  },

  /** DELETE /disputes/:id — dismiss/delete a dispute */
  deleteDispute: async (id) => {
    const response = await apiClient.delete(`/disputes/${id}`);
    return response.data;
  },
};

export default disputeService;
