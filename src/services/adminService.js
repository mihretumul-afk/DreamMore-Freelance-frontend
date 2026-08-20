import apiClient from '../api/client';

/**
 * Admin service — the ONLY module responsible for admin API requests.
 *
 * All endpoints are under /admin/* and require role=admin on the backend.
 * The shared Axios client handles auth tokens and 401 clearing automatically.
 */
export const adminService = {
  // ── Dashboard ────────────────────────────────────────────────────────
  /** GET /admin/dashboard — platform-wide statistics. */
  getDashboard: async () => {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  },

  // ── Users ────────────────────────────────────────────────────────────
  /** GET /admin/users?page=&search=&role=&status= — paginated user list. */
  getUsers: async (params = {}) => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  /** GET /admin/users/:id — single user detail. */
  getUserById: async (id) => {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },

  /** PUT /admin/users/:id/status — activate or deactivate a user. */
  toggleUserStatus: async (id, isActive) => {
    const response = await apiClient.put(`/admin/users/${id}/status`, {
      is_active: isActive,
    });
    return response.data;
  },

  /** PUT /admin/users/:id/role — change a user's role. */
  updateUserRole: async (id, role) => {
    const response = await apiClient.put(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  /** DELETE /admin/users/:id — soft-delete a user. */
  deleteUser: async (id) => {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data;
  },

  // ── Verifications ────────────────────────────────────────────────────
  /** GET /admin/verifications?status= — list pending/processed verifications. */
  getVerifications: async (params = {}) => {
    const response = await apiClient.get('/admin/verifications', { params });
    return response.data;
  },

  /** PUT /admin/verifications/:id/approve — approve a verification request. */
  approveVerification: async (id) => {
    const response = await apiClient.put(`/admin/verifications/${id}/approve`);
    return response.data;
  },

  /** PUT /admin/verifications/:id/reject — reject a verification request. */
  rejectVerification: async (id, reason = '') => {
    const response = await apiClient.put(`/admin/verifications/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  // ── Credentials ───────────────────────────────────────────────────────
  /** GET /admin/credentials/:id — single credential detail. */
  getCredentialById: async (id) => {
    const response = await apiClient.get(`/admin/credentials/${id}`);
    return response.data;
  },

  /** PUT /admin/credentials/:id/approve — approve a credential. */
  approveCredential: async (id) => {
    const response = await apiClient.put(`/admin/credentials/${id}/approve`);
    return response.data;
  },

  /** PUT /admin/credentials/:id/reject — reject a credential. */
  rejectCredential: async (id, reason = '') => {
    const response = await apiClient.put(`/admin/credentials/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  /** GET /admin/credentials/:id/download — download credential file. */
  downloadCredential: async (id) => {
    const response = await apiClient.get(`/admin/credentials/${id}/download`, {
      responseType: 'blob',
    });
    return response;
  },

  // ── Jobs ─────────────────────────────────────────────────────────────
  /** GET /admin/jobs?page=&search=&status= — paginated job list. */
  getJobs: async (params = {}) => {
    const response = await apiClient.get('/admin/jobs', { params });
    return response.data;
  },

  /** PUT /admin/jobs/:id/status — moderate a job (approve / reject / feature / unfeature). */
  moderateJob: async (id, status) => {
    const response = await apiClient.put(`/admin/jobs/${id}/status`, { status });
    return response.data;
  },

  /** DELETE /admin/jobs/:id — remove a job. */
  deleteJob: async (id) => {
    const response = await apiClient.delete(`/admin/jobs/${id}`);
    return response.data;
  },

  // ── Reports ──────────────────────────────────────────────────────────
  /** GET /admin/reports?page=&status= — list platform reports. */
  getReports: async (params = {}) => {
    const response = await apiClient.get('/admin/reports', { params });
    return response.data;
  },

  /** GET /admin/reports/:id — single report detail. */
  getReportById: async (id) => {
    const response = await apiClient.get(`/admin/reports/${id}`);
    return response.data;
  },

  /** PUT /admin/reports/:id/resolve — mark a report as resolved. */
  resolveReport: async (id, resolution = '') => {
    const response = await apiClient.put(`/admin/reports/${id}/resolve`, {
      resolution,
    });
    return response.data;
  },

  /** DELETE /admin/reports/:id — dismiss a report. */
  dismissReport: async (id) => {
    const response = await apiClient.delete(`/admin/reports/${id}`);
    return response.data;
  },

  // ── Categories ───────────────────────────────────────────────────────
  /** GET /admin/categories — list all categories. */
  getCategories: async (params = {}) => {
    const response = await apiClient.get('/admin/categories', { params });
    return response.data;
  },

  /** POST /admin/categories — create a new category. */
  createCategory: async (payload) => {
    const response = await apiClient.post('/admin/categories', payload);
    return response.data;
  },

  /** PUT /admin/categories/:id — update a category. */
  updateCategory: async (id, payload) => {
    const response = await apiClient.put(`/admin/categories/${id}`, payload);
    return response.data;
  },

  /** DELETE /admin/categories/:id — delete a category. */
  deleteCategory: async (id) => {
    const response = await apiClient.delete(`/admin/categories/${id}`);
    return response.data;
  },

  // ── Skills ───────────────────────────────────────────────────────────
  /** GET /admin/skills?page=&search=&category= — paginated skill list. */
  getSkills: async (params = {}) => {
    const response = await apiClient.get('/admin/skills', { params });
    return response.data;
  },

  /** POST /admin/skills — create a new skill. */
  createSkill: async (payload) => {
    const response = await apiClient.post('/admin/skills', payload);
    return response.data;
  },

  /** PUT /admin/skills/:id — update a skill. */
  updateSkill: async (id, payload) => {
    const response = await apiClient.put(`/admin/skills/${id}`, payload);
    return response.data;
  },

  /** DELETE /admin/skills/:id — delete a skill. */
  deleteSkill: async (id) => {
    const response = await apiClient.delete(`/admin/skills/${id}`);
    return response.data;
  },

  // ── Settings ─────────────────────────────────────────────────────────
  /** GET /admin/settings — fetch platform settings. */
  getSettings: async () => {
    const response = await apiClient.get('/admin/settings');
    return response.data;
  },

  /** PUT /admin/settings — update platform settings. */
  updateSettings: async (payload) => {
    const response = await apiClient.put('/admin/settings', payload);
    return response.data;
  },
};

export default adminService;
