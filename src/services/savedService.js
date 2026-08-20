import apiClient from '../api/client';

/**
 * Saved service — the ONLY module responsible for saved-jobs and
 * saved-freelancers API requests.
 *
 * Endpoints:
 *   GET    /saved-jobs                 list own saved jobs
 *   POST   /jobs/{id}/save             save a job
 *   GET    /jobs/{id}/saved            check if job is saved
 *   DELETE /jobs/{id}/save             unsave a job
 *
 *   GET    /saved-freelancers          list own saved freelancers
 *   POST   /freelancers/{id}/save      save a freelancer
 *   GET    /freelancers/{id}/saved     check if freelancer is saved
 *   DELETE /freelancers/{id}/save      unsave a freelancer
 */
export const savedService = {
  // ---- Saved Jobs ----

  /** List the authenticated user's saved jobs. */
  getSavedJobs: async (params = {}) => {
    const response = await apiClient.get('/saved-jobs', { params });
    return response.data;
  },

  /** Save a job by its id. */
  saveJob: async (jobId) => {
    const response = await apiClient.post(`/jobs/${jobId}/save`);
    return response.data;
  },

  /** Check whether a job is saved. */
  isJobSaved: async (jobId) => {
    const response = await apiClient.get(`/jobs/${jobId}/saved`);
    return response.data;
  },

  /** Remove a job from saved list. */
  unsaveJob: async (jobId) => {
    const response = await apiClient.delete(`/jobs/${jobId}/save`);
    return response.data;
  },

  // ---- Saved Freelancers ----

  /** List the authenticated user's saved freelancers. */
  getSavedFreelancers: async (params = {}) => {
    const response = await apiClient.get('/saved-freelancers', { params });
    return response.data;
  },

  /** Save a freelancer by their profile id. */
  saveFreelancer: async (freelancerId) => {
    const response = await apiClient.post(`/freelancers/${freelancerId}/save`);
    return response.data;
  },

  /** Check whether a freelancer is saved. */
  isFreelancerSaved: async (freelancerId) => {
    const response = await apiClient.get(`/freelancers/${freelancerId}/saved`);
    return response.data;
  },

  /** Remove a freelancer from saved list. */
  unsaveFreelancer: async (freelancerId) => {
    const response = await apiClient.delete(`/freelancers/${freelancerId}/save`);
    return response.data;
  },
};

export default savedService;
