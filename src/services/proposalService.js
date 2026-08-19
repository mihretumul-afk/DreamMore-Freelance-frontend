import apiClient from '../api/client';

/**
 * Proposal service — the ONLY module responsible for proposal API requests.
 *
 * Endpoints confirmed from the Laravel backend (routes/api.php + controller):
 *   GET    /proposals                               freelancer's proposals (paginated 15)
 *   GET    /proposals/{proposal}                    proposal detail (freelancer/admin)
 *   POST   /jobs/{job}/proposals                    submit a proposal (freelancer)
 *   PUT    /proposals/{proposal}                    update while pending/shortlisted
 *   POST   /proposals/{proposal}/withdraw           withdraw while pending/shortlisted
 *   GET    /jobs/{job}/proposals                    employer's proposals for own job (paginated 15)
 *   POST   /jobs/{job}/proposals/{proposal}/shortlist   pending → shortlisted
 *   POST   /jobs/{job}/proposals/{proposal}/reject      pending/shortlisted → rejected
 *   POST   /jobs/{job}/proposals/{proposal}/accept      pending/shortlisted → accepted
 *                                                    (creates contract server-side, rejects the
 *                                                    other active proposals, moves job to in-progress)
 *
 * Status actions take no payload (ProposalStatusRequest is empty). All list
 * endpoints paginate with meta { current_page, last_page, per_page, total }.
 */
export const proposalService = {
  /** Fetch the authenticated freelancer's proposals (paginated). */
  getMyProposals: async (params = {}) => {
    const response = await apiClient.get('/proposals', { params });
    return response.data; // { success, message, data, meta }
  },

  /** Fetch a single proposal (freelancer's own, or any for admin). */
  getProposal: async (id) => {
    const response = await apiClient.get(`/proposals/${id}`);
    return response.data; // { success, message, data }
  },

  /** Submit a proposal for an open job (freelancer). */
  createProposal: async (jobId, payload) => {
    const response = await apiClient.post(`/jobs/${jobId}/proposals`, payload);
    return response.data; // { success, message, data }
  },

  /** Update a proposal while it is pending or shortlisted. */
  updateProposal: async (id, payload) => {
    const response = await apiClient.put(`/proposals/${id}`, payload);
    return response.data; // { success, message, data }
  },

  /** Withdraw a proposal while it is pending or shortlisted. */
  withdrawProposal: async (id) => {
    const response = await apiClient.post(`/proposals/${id}/withdraw`);
    return response.data; // { success, message, data }
  },

  /** Fetch proposals submitted to one of the employer's own jobs (paginated). */
  getJobProposals: async (jobId, params = {}) => {
    const response = await apiClient.get(`/jobs/${jobId}/proposals`, { params });
    return response.data; // { success, message, data, meta }
  },

  /** Employer shortlists a pending proposal on their own job. */
  shortlistProposal: async (jobId, proposalId) => {
    const response = await apiClient.post(`/jobs/${jobId}/proposals/${proposalId}/shortlist`);
    return response.data; // { success, message, data }
  },

  /** Employer rejects a pending/shortlisted proposal on their own job. */
  rejectProposal: async (jobId, proposalId) => {
    const response = await apiClient.post(`/jobs/${jobId}/proposals/${proposalId}/reject`);
    return response.data; // { success, message, data }
  },

  /**
   * Employer accepts a pending/shortlisted proposal. The backend creates the
   * contract, rejects the remaining active proposals, and moves the job to
   * in-progress — the frontend only calls this and refreshes real data.
   */
  acceptProposal: async (jobId, proposalId) => {
    const response = await apiClient.post(`/jobs/${jobId}/proposals/${proposalId}/accept`);
    return response.data; // { success, message, data (proposal incl. contract) }
  },
};

export default proposalService;
