import axios from 'axios';
import { API_BASE_URL } from '../config/env';
import { getToken, clearStoredSession } from '../utils/authStorage';

/**
 * Shared Axios client for the Dream More AppWorks Laravel API.
 *
 * - Base URL comes from VITE_API_BASE_URL (see config/env.js).
 * - A Bearer token is attached automatically when one is stored (localStorage
 *   for "remember me" sessions, sessionStorage for session-only logins — see
 *   utils/authStorage.js).
 * - A single response interceptor handles 401s: it drops the stale token and
 *   dispatches the `appworks:unauthorized` window event so AuthProvider can
 *   clear React state and let the route guards redirect to /login.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach the stored access token to every request.
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Single response interceptor: normalize 401s and keep everything else untouched.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadToken = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && hadToken) {
      // Drop the invalid session from both storages…
      clearStoredSession();
      // …and tell the auth context so in-memory state stays in sync.
      window.dispatchEvent(new Event('appworks:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export default apiClient;
