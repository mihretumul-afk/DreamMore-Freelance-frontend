import apiClient from '../api/client';

/**
 * Freelancer service — the ONLY module responsible for freelancer API requests.
 *
 * Endpoints confirmed from the Laravel backend (routes/api.php + controller):
 *   GET /freelancers                public discovery listing (paginated)
 *   GET /freelancers/{id}           public profile by profile id OR user id
 *   GET /freelancer/profile         own profile (auth:sanctum, freelancer/admin)
 *   PUT /freelancer/profile         update own profile (auth:sanctum)
 */
export const freelancerService = {
  /** Discover freelancers with search, filtering, sorting and pagination. */
  getFreelancers: async (params = {}) => {
    const response = await apiClient.get('/freelancers', { params });
    return response.data; // { success, message, data, meta }
  },

  /** Fetch a public freelancer profile by profile id or user id. */
  getFreelancer: async (id) => {
    const response = await apiClient.get(`/freelancers/${id}`);
    return response.data; // { success, message, data }
  },

  /** Fetch the authenticated freelancer's own profile. */
  getMyProfile: async () => {
    const response = await apiClient.get('/freelancer/profile');
    return response.data; // { success, message, data }
  },

  /** Update the authenticated freelancer's own profile (PUT). */
  updateMyProfile: async (payload) => {
    const response = await apiClient.put('/freelancer/profile', payload);
    return response.data; // { success, message, data }
  },
};

export default freelancerService;
