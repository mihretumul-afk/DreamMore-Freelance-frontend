import apiClient from '../api/client';

/**
 * Contract service — manages contracts and milestones.
 */
export const contractService = {
  // ── Contracts ──────────────────────────────────────────────────────────

  /** GET /contracts — list user's contracts */
  getContracts: async (params = {}) => {
    const response = await apiClient.get('/contracts', { params });
    return response.data;
  },

  /** GET /contracts/:id — single contract with milestones */
  getContract: async (id) => {
    const response = await apiClient.get(`/contracts/${id}`);
    return response.data;
  },

  /** POST /contracts/:id/freelancer/accept — freelancer accepts contract */
  acceptContract: async (id) => {
    const response = await apiClient.post(`/contracts/${id}/freelancer/accept`);
    return response.data;
  },

  /** POST /contracts/:id/freelancer/decline — freelancer declines contract */
  declineContract: async (id, reason = '') => {
    const response = await apiClient.post(`/contracts/${id}/freelancer/decline`, { reason });
    return response.data;
  },

  /** DELETE /contracts/:id — delete contract from history */
  deleteContract: async (id) => {
    const response = await apiClient.delete(`/contracts/${id}`);
    return response.data;
  },

  // ── File Attachments ────────────────────────────────────────────────────

  /** DELETE /milestone-attachments/:id — delete a milestone attachment */
  deleteAttachment: async (attachmentId) => {
    const response = await apiClient.delete(`/milestone-attachments/${attachmentId}`);
    return response.data;
  },

  // ── Milestones ─────────────────────────────────────────────────────────

  /** GET /contracts/:id/milestones — list milestones */
  getMilestones: async (contractId) => {
    const response = await apiClient.get(`/contracts/${contractId}/milestones`);
    return response.data;
  },

  /** GET /contracts/:id/milestones/:milestoneId — single milestone */
  getMilestone: async (contractId, milestoneId) => {
    const response = await apiClient.get(`/contracts/${contractId}/milestones/${milestoneId}`);
    return response.data;
  },

  /** POST /contracts/:id/milestones — create milestone (supports FormData for file uploads) */
  createMilestone: async (contractId, payload) => {
    const config = payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await apiClient.post(`/contracts/${contractId}/milestones`, payload, config);
    return response.data;
  },

  /** PUT /contracts/:id/milestones/:milestoneId — update milestone */
  updateMilestone: async (contractId, milestoneId, payload) => {
    const response = await apiClient.put(`/contracts/${contractId}/milestones/${milestoneId}`, payload);
    return response.data;
  },

  /** DELETE /contracts/:id/milestones/:milestoneId — delete milestone */
  deleteMilestone: async (contractId, milestoneId) => {
    const response = await apiClient.delete(`/contracts/${contractId}/milestones/${milestoneId}`);
    return response.data;
  },

  /** POST /contracts/:id/milestones/:milestoneId/start — start work */
  startWork: async (contractId, milestoneId) => {
    const response = await apiClient.post(`/contracts/${contractId}/milestones/${milestoneId}/start`);
    return response.data;
  },

  /** POST /contracts/:id/milestones/:milestoneId/submit — submit work (supports FormData for file uploads) */
  submitWork: async (contractId, milestoneId, payload = {}) => {
    const config = payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await apiClient.post(`/contracts/${contractId}/milestones/${milestoneId}/submit`, payload, config);
    return response.data;
  },

  /** POST /contracts/:id/milestones/:milestoneId/approve — approve work */
  approveMilestone: async (contractId, milestoneId) => {
    const response = await apiClient.post(`/contracts/${contractId}/milestones/${milestoneId}/approve`);
    return response.data;
  },

  /** POST /contracts/:id/milestones/:milestoneId/revision — request revision */
  requestRevision: async (contractId, milestoneId, revisionNote) => {
    const response = await apiClient.post(`/contracts/${contractId}/milestones/${milestoneId}/revision`, {
      revision_note: revisionNote,
    });
    return response.data;
  },

  /** POST /contracts/:id/milestones/:milestoneId/dispute — open dispute */
  openDispute: async (contractId, milestoneId, reason) => {
    const response = await apiClient.post(`/contracts/${contractId}/milestones/${milestoneId}/dispute`, {
      reason,
    });
    return response.data;
  },

  /** DELETE /contracts/:id/milestones/:milestoneId/submissions/:submissionId/files — delete a file */
  deleteSubmissionFile: async (contractId, milestoneId, submissionId, filePath) => {
    const response = await apiClient.delete(`/contracts/${contractId}/milestones/${milestoneId}/submissions/${submissionId}/files`, {
      data: { file_path: filePath },
    });
    return response.data;
  },
};

export default contractService;
