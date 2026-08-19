import apiClient from '../api/client';

/**
 * Freelancer service — the ONLY module responsible for freelancer API requests.
 *
 * Endpoints confirmed from the Laravel backend (routes/api.php + controller):
 *   GET /freelancers/{id}          public profile by profile id OR user id
 *   GET /freelancer/profile        own profile (auth:sanctum, freelancer/admin)
 *   PUT /freelancer/profile        update own profile (auth:sanctum)
 *
 * NOTE: There is currently NO public discovery/listing endpoint
 * (GET /freelancers) in the backend — the controller has no index() and no
 * such route is registered. `getFreelancers` is intentionally NOT defined
 * here; it will be added when the backend provides the listing contract.
 */
export const freelancerService = {
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
