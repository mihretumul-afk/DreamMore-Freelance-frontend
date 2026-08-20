import apiClient from '../api/client';

/**
 * Recommendation service — the ONLY module responsible for recommendation API requests.
 *
 * Endpoints:
 *   GET /recommendations/jobs         recommended jobs for freelancers
 *   GET /recommendations/freelancers  recommended freelancers for employers
 */
export const recommendationService = {
  /** Get recommended jobs for the authenticated freelancer. */
  getRecommendedJobs: async (params = {}) => {
    const response = await apiClient.get('/recommendations/jobs', { params });
    return response.data;
  },

  /** Get recommended freelancers for the authenticated employer. */
  getRecommendedFreelancers: async (params = {}) => {
    const response = await apiClient.get('/recommendations/freelancers', { params });
    return response.data;
  },
};

export default recommendationService;
