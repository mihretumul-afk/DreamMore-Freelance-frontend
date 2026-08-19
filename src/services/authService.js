import apiClient from '../api/client';

/**
 * Auth service — the ONLY module responsible for authentication API requests.
 *
 * Endpoints confirmed from the Laravel backend (routes/api.php + AuthController):
 *   POST /auth/register   register a user (returns { user, token })
 *   POST /auth/login      authenticate (returns { user, token })
 *   GET  /auth/me         current user (auth:sanctum)
 *   POST /auth/logout     revoke the current token (auth:sanctum)
 *
 * No other auth endpoints exist on the backend (no password reset, no refresh).
 * Success payloads are wrapped as { success, message, data }; `data` carries
 * `{ user, token }` for login/register and the user object for /auth/me.
 */
export const authService = {
  /** Authenticate with email + password. Resolves to { user, token }. */
  login: async ({ email, password }) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data.data;
  },

  /** Register a new account. Payload follows RegisterRequest (backend rules). */
  register: async (payload) => {
    const response = await apiClient.post('/auth/register', payload);
    return response.data.data;
  },

  /** Fetch the currently authenticated user (token attached by the client). */
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },

  /** Revoke the current token on the server. Rejects on failure. */
  logout: async () => {
    await apiClient.post('/auth/logout');
  },
};

export default authService;
