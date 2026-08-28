import apiClient from '../api/client';

/**
 * Contract service — the ONLY module responsible for contract API requests.
 *
 * Endpoints confirmed from the Laravel backend (routes/api.php + ContractController):
 *   GET  /contracts                    contracts where the user is employer OR freelancer
 *                                     (full collection — NOT paginated)
 *   GET  /contracts/{id}               single contract (owner/admin only)
 *   POST /contracts/{id}/pause         employer: active → paused
 *   POST /contracts/{id}/resume        employer: paused → active
 *   POST /contracts/{id}/complete      employer: active → completed (all milestones approved/paid)
 *   POST /contracts/{id}/cancel        employer: active/paused → cancelled
 *
 * Milestone endpoints live in milestoneService.js (they are a separate backend
 * resource under /contracts/{contract}/milestones).
 *
 * Response shape: { success, message, data } (no pagination meta).
 */
export const contractService = {
  /** Fetch contracts the authenticated user is part of (employer or freelancer). */
  getMyContracts: async () => {
    const response = await apiClient.get('/contracts');
    return response.data; // { success, message, data }
  },

  /** Fetch a single contract (owner/admin only). Includes job, employer, freelancer, milestones. */
  getContract: async (id) => {
    const response = await apiClient.get(`/contracts/${id}`);
    return response.data; // { success, message, data }
  },

  /** Employer pauses an active contract. */
  pauseContract: async (id) => {
    const response = await apiClient.post(`/contracts/${id}/pause`);
    return response.data; // { success, message, data }
  },

  /** Employer resumes a paused contract. */
  resumeContract: async (id) => {
    const response = await apiClient.post(`/contracts/${id}/resume`);
    return response.data; // { success, message, data }
  },

  /** Employer completes an active contract (all milestones must be approved/paid). */
  completeContract: async (id) => {
    const response = await apiClient.post(`/contracts/${id}/complete`);
    return response.data; // { success, message, data }
  },

  /** Employer cancels an active or paused contract. */
  cancelContract: async (id) => {
    const response = await apiClient.post(`/contracts/${id}/cancel`);
    return response.data; // { success, message, data }
  },

  /** Employer or Freelancer raises a dispute on a contract. */
  disputeContract: async (id, data) => {
    const response = await apiClient.post(`/contracts/${id}/dispute`, data);
    return response.data; // { success, message, data }
  },

  /** Fetch activity log for a contract. */
  getActivities: async (id, limit = 50) => {
    const response = await apiClient.get(`/contracts/${id}/activities`, { params: { limit } });
    return response.data; // { success, message, data }
  },
};

export default contractService;
