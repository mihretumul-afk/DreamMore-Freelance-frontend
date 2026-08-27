import apiClient from '../api/client';

/**
 * Milestone service — the ONLY module responsible for milestone API requests.
 *
 * Endpoints confirmed from the Laravel backend (routes/api.php + MilestoneController):
 *   GET    /contracts/{contract}/milestones                    list (contract owner/admin)
 *   POST   /contracts/{contract}/milestones                    create (employer, active contract)
 *   GET    /contracts/{contract}/milestones/{milestone}        show (contract owner/admin)
 *   PUT    /contracts/{contract}/milestones/{milestone}        update (employer, pending/in_progress)
 *   POST   /contracts/{contract}/milestones/{milestone}/submit     freelancer: submit work (files, links, description)
 *   POST   /contracts/{contract}/milestones/{milestone}/approve    employer: submitted → approved
 *   POST   /contracts/{contract}/milestones/{milestone}/revision   employer: request revision with note
 *   DELETE /contracts/{contract}/milestones/{milestone}        employer: pending only
 *   GET    /contracts/{contract}/milestones/{milestone}/submissions  list deliverable submissions
 *   GET    /contracts/{contract}/milestones/{milestone}/submissions/{sub}/files/{file}/download download file
 */
export const milestoneService = {
  /** List milestones for a contract the user belongs to. */
  getMilestones: async (contractId) => {
    const response = await apiClient.get(`/contracts/${contractId}/milestones`);
    return response.data; // { success, message, data }
  },

  /** Fetch a single milestone scoped to its contract. */
  getMilestone: async (contractId, milestoneId) => {
    const response = await apiClient.get(`/contracts/${contractId}/milestones/${milestoneId}`);
    return response.data; // { success, message, data }
  },

  /** Employer creates a milestone on an active contract. */
  createMilestone: async (contractId, payload) => {
    const isFormData = payload instanceof FormData;
    const response = await apiClient.post(
      `/contracts/${contractId}/milestones`,
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {},
    );
    return response.data; // { success, message, data } (201)
  },

  /** Employer updates a pending/in-progress milestone on an active contract. */
  updateMilestone: async (contractId, milestoneId, payload) => {
    const isFormData = payload instanceof FormData;
    const response = await apiClient.put(
      `/contracts/${contractId}/milestones/${milestoneId}`,
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {},
    );
    return response.data; // { success, message, data }
  },

  /** Freelancer starts working on a funded milestone. */
  startWork: async (contractId, milestoneId) => {
    const response = await apiClient.post(`/contracts/${contractId}/milestones/${milestoneId}/start`);
    return response.data; // { success, message, data }
  },

  /** Freelancer submits deliverables for milestone review (supports FormData or JSON). */
  submitMilestone: async (contractId, milestoneId, payload) => {
    const isFormData = payload instanceof FormData;
    const response = await apiClient.post(
      `/contracts/${contractId}/milestones/${milestoneId}/submit`,
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {},
    );
    return response.data; // { success, message, data }
  },

  /** Employer approves a submitted milestone. */
  approveMilestone: async (contractId, milestoneId) => {
    const response = await apiClient.post(`/contracts/${contractId}/milestones/${milestoneId}/approve`);
    return response.data; // { success, message, data }
  },

  /** Employer sends a submitted milestone back for revision with feedback note. */
  requestMilestoneRevision: async (contractId, milestoneId, payload) => {
    const response = await apiClient.post(
      `/contracts/${contractId}/milestones/${milestoneId}/revision`,
      payload,
    );
    return response.data; // { success, message, data }
  },

  /** Get all deliverable submissions for a milestone. */
  getMilestoneSubmissions: async (contractId, milestoneId) => {
    const response = await apiClient.get(
      `/contracts/${contractId}/milestones/${milestoneId}/submissions`,
    );
    return response.data; // { success, message, data }
  },

  /** Employer deletes a pending milestone. */
  deleteMilestone: async (contractId, milestoneId) => {
    const response = await apiClient.delete(`/contracts/${contractId}/milestones/${milestoneId}`);
    return response.data; // { success, message, data: null }
  },

  /** Securely download a submission deliverable file as a Blob. */
  downloadSubmissionFile: async (contractId, milestoneId, submissionId, fileId, originalFilename) => {
    const response = await apiClient.get(
      `/contracts/${contractId}/milestones/${milestoneId}/submissions/${submissionId}/files/${fileId}/download`,
      { responseType: 'blob' },
    );
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = originalFilename || 'deliverable-file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default milestoneService;
