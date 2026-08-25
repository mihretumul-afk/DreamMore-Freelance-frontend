import apiClient from '../api/client';

/**
 * rbacService — all RBAC endpoints added by Stage 1 backend.
 *
 * Covers: roles, permissions, admin-user management, audit logs.
 * Every method returns response.data (the full Laravel envelope).
 */
export const rbacService = {
  // ── Roles ─────────────────────────────────────────────────────────────

  /** GET /admin/roles — list all roles with permission counts. */
  getRoles: async (params = {}) => {
    const res = await apiClient.get('/admin/roles', { params });
    return res.data;
  },

  /** GET /admin/roles/:id — single role with permissions. */
  getRoleById: async (id) => {
    const res = await apiClient.get(`/admin/roles/${id}`);
    return res.data;
  },

  /** POST /admin/roles — create custom role (Super Admin only). */
  createRole: async (payload) => {
    const res = await apiClient.post('/admin/roles', payload);
    return res.data;
  },

  /** PUT /admin/roles/:id — update role name/description/active state. */
  updateRole: async (id, payload) => {
    const res = await apiClient.put(`/admin/roles/${id}`, payload);
    return res.data;
  },

  /** DELETE /admin/roles/:id — delete custom role (Super Admin only). */
  deleteRole: async (id) => {
    const res = await apiClient.delete(`/admin/roles/${id}`);
    return res.data;
  },

  /** PUT /admin/roles/:id/permissions — sync role permissions. */
  syncRolePermissions: async (id, permissions) => {
    const res = await apiClient.put(`/admin/roles/${id}/permissions`, { permissions });
    return res.data;
  },

  // ── Permissions ───────────────────────────────────────────────────────

  /** GET /admin/permissions — all permissions grouped by domain. */
  getPermissions: async () => {
    const res = await apiClient.get('/admin/permissions');
    return res.data;
  },

  // ── Admin users ───────────────────────────────────────────────────────

  /** GET /admin/admins — paginated admin user list. */
  getAdmins: async (params = {}) => {
    const res = await apiClient.get('/admin/admins', { params });
    return res.data;
  },

  /** GET /admin/admins/:id — single admin detail with roles + permissions. */
  getAdminById: async (id) => {
    const res = await apiClient.get(`/admin/admins/${id}`);
    return res.data;
  },

  /** POST /admin/admins — create admin account (Super Admin only). */
  createAdmin: async (payload) => {
    const res = await apiClient.post('/admin/admins', payload);
    return res.data;
  },

  /** PUT /admin/admins/:id/status — activate or deactivate. */
  toggleAdminStatus: async (id, isActive) => {
    const res = await apiClient.put(`/admin/admins/${id}/status`, { is_active: isActive });
    return res.data;
  },

  /** PUT /admin/admins/:id/roles — sync role assignments. */
  assignRoles: async (id, roles) => {
    const res = await apiClient.put(`/admin/admins/${id}/roles`, { roles });
    return res.data;
  },

  /** DELETE /admin/admins/:id — delete admin (Super Admin only). */
  deleteAdmin: async (id) => {
    const res = await apiClient.delete(`/admin/admins/${id}`);
    return res.data;
  },

  // ── Audit logs ────────────────────────────────────────────────────────

  /** GET /admin/audit-logs — paginated audit log. */
  getAuditLogs: async (params = {}) => {
    const res = await apiClient.get('/admin/audit-logs', { params });
    return res.data;
  },
};

export default rbacService;
