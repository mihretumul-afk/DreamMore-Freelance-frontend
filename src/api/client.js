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
    Accept: 'application/json',
  },
});

// Attach the stored access token and correct Content-Type to every request.
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // FormData bodies need multipart/form-data with boundary — axios
    // auto-generates this ONLY when no Content-Type is set, so we must
    // not set it for FormData. For everything else default to JSON.
    if (config.data instanceof FormData) {
      config.headers.delete('Content-Type');
    } else if (!config.headers.has('Content-Type')) {
      config.headers.set('Content-Type', 'application/json');
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Single response interceptor: normalize 401s, handle blob error responses.
apiClient.interceptors.response.use(
  (response) => {
    // When responseType is 'blob' and the server returns a JSON error
    // (4xx/5xx), axios resolves with a blob containing JSON text instead of
    // rejecting. Detect this and reject so callers get a proper error.
    if (
      response.config?.responseType === 'blob' &&
      response.data instanceof Blob &&
      response.headers?.['content-type']?.includes('application/json')
    ) {
      return response.data.text().then((text) => {
        const parsed = JSON.parse(text);
        const err = new Error(parsed.message || 'Request failed');
        err.response = { status: response.status, data: parsed, headers: response.headers };
        return Promise.reject(err);
      });
    }
    return response;
  },
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
