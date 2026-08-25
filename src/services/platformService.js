import apiClient from '../api/client';

/**
 * Platform settings service — fetches public platform configuration
 * that the frontend needs to render correctly (name, description,
 * currency, registration status, maintenance mode).
 *
 * These endpoints do NOT require authentication.
 */
export const platformService = {
  /** GET /platform-settings — public platform configuration. */
  getSettings: async () => {
    const response = await apiClient.get('/platform-settings');
    return response.data;
  },
};

export default platformService;
