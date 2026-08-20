import apiClient from '../api/client';

/**
 * Skill service — the ONLY module responsible for public skill API requests.
 *
 * Endpoints:
 *   GET /skills   public listing of active skills
 */
export const skillService = {
  /** Fetch all active skills, optionally filtered by category. */
  getSkills: async (params = {}) => {
    const response = await apiClient.get('/skills', { params });
    return response.data; // { success, message, data }
  },
};

export default skillService;
