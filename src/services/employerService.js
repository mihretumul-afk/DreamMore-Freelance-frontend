import apiClient from '../api/client';

/**
 * Employer service — the ONLY module responsible for employer API requests.
 *
 * Endpoints confirmed from the Laravel backend (routes/api.php + controllers):
 *   GET /employer/profile   own profile (auth:sanctum, employer/admin)
 *   PUT /employer/profile   update own profile (auth:sanctum)
 *   GET /employer/jobs      employer's own jobs, all statuses (paginated 15)
 *   GET /employers/{id}     public profile by profile id OR user id
 *
 * NOTE: `getEmployer` (public) is intentionally NOT defined here yet — no
 * frontend page consumes it until the public employer profile ships. The
 * endpoint exists on the backend (EmployerProfileController@showPublic).
 *
 * Response shape: { success, message, data, meta: { current_page, last_page,
 * per_page, total } } for job lists.
 */
export const employerService = {
  /** Fetch the authenticated employer's own profile. */
  getMyProfile: async () => {
    const response = await apiClient.get('/employer/profile');
    return response.data; // { success, message, data }
  },

  /** Update the authenticated employer's own profile (PUT). */
  updateMyProfile: async (payload) => {
    const response = await apiClient.put('/employer/profile', payload);
    return response.data; // { success, message, data }
  },

  /** Fetch the authenticated employer's own jobs (paginated, all statuses). */
  getMyJobs: async (params = {}) => {
    const response = await apiClient.get('/employer/jobs', { params });
    return response.data; // { success, message, data, meta }
  },
};

export default employerService;
