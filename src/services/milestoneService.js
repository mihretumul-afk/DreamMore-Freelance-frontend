import apiClient from '../api/client';

/**
 * Milestone service — the ONLY module responsible for milestone API requests.
 *
 * Endpoints confirmed from the Laravel backend (routes/api.php + MilestoneController):
 *   GET    /contracts/{contract}/milestones                    list (contract owner/admin)
 *   POST   /contracts/{contract}/milestones                    create (employer, active contract)
 *   GET    /contracts/{contract}/milestones/{milestone}        show (contract owner/admin)
 *   PUT    /contracts/{contract}/milestones/{milestone}        update (employer, pending/in_progress)
 *   POST   /contracts/{contract}/milestones/{milestone}/submit     freelancer: pending/in_progress → submitted
 *   POST   /contracts/{contract}/milestones/{milestone}/approve    employer: submitted → approved
 *   POST   /contracts/{contract}/milestones/{milestone}/revision   employer: submitted → in_progress
 *   DELETE /contracts/{contract}/milestones/{milestone}        employer: pending only
 *
 * Create/update payload (MilestoneRequest): { title, description?, amount, due_date? }.
 * Status actions take no payload (MilestoneSubmissionRequest is empty).
 *
 * Response shape: { success, message, data } — the contract's milestones are
 * also embedded in the ContractResource, so pages usually refresh the contract
 * after an action instead of calling the list endpoint separately.
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
    const response = await apiClient.post(`/contracts/${contractId}/milestones`, payload);
    return response.data; // { success, message, data } (201)
  },

  /** Employer updates a pending/in-progress milestone on an active contract. */
  updateMilestone: async (contractId, milestoneId, payload) => {
    const response = await apiClient.put(`/contracts/${contractId}/milestones/${milestoneId}`, payload);
    return response.data; // { success, message, data }
  },

  /** Freelancer submits a pending/in-progress milestone for review. */
  submitMilestone: async (contractId, milestoneId) => {
    const response = await apiClient.post(`/contracts/${contractId}/milestones/${milestoneId}/submit`);
    return response.data; // { success, message, data }
  },

  /** Employer approves a submitted milestone. */
  approveMilestone: async (contractId, milestoneId) => {
    const response = await apiClient.post(`/contracts/${contractId}/milestones/${milestoneId}/approve`);
    return response.data; // { success, message, data }
  },

  /** Employer sends a submitted milestone back for revision (→ in_progress). */
  requestMilestoneRevision: async (contractId, milestoneId) => {
    const response = await apiClient.post(`/contracts/${contractId}/milestones/${milestoneId}/revision`);
    return response.data; // { success, message, data }
  },

  /** Employer deletes a pending milestone. */
  deleteMilestone: async (contractId, milestoneId) => {
    const response = await apiClient.delete(`/contracts/${contractId}/milestones/${milestoneId}`);
    return response.data; // { success, message, data: null }
  },
};

export default milestoneService;
