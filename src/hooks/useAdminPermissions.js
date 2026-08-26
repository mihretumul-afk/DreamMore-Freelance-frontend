import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { rbacService } from '../services/rbacService';

/**
 * useAdminPermissions
 *
 * Fetches the current admin user's effective permissions from GET /auth/me
 * (the backend populates admin_roles on the user response) and provides
 * helpers for permission-gated UI rendering.
 *
 * The hook is intentionally lightweight:
 *  - It reads `user.admin_roles` if already present on the auth user object.
 *  - Falls back to fetching from GET /admin/admins/:id when roles aren't embedded.
 *  - Super Admin (isSuperAdmin) bypasses all checks → returns true for everything.
 *
 * Usage:
 *   const { can, isSuperAdmin, adminRoleSlugs, loading } = useAdminPermissions();
 *   if (can('users.view')) { ... }
 */
export function useAdminPermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState(/** @type {string[]} */ ([]));
  const [adminRoleSlugs, setAdminRoleSlugs] = useState(/** @type {string[]} */ ([]));
  const [loading, setLoading] = useState(true);

  const loadPermissions = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      setPermissions([]);
      setAdminRoleSlugs([]);
      setLoading(false);
      return;
    }      try {
      // If the auth response already embeds admin detail, use it.
      if (user.all_permissions && Array.isArray(user.all_permissions)) {
        setPermissions(user.all_permissions);
        const slugs = (user.admin_roles || []).map((r) => r.slug).filter(Boolean);
        setAdminRoleSlugs(slugs);
        setLoading(false);
        return;
      }

      // Otherwise fetch from the admin detail endpoint.
      const res = await rbacService.getAdminById(user.id);
      const detail = res.data ?? res;
      setPermissions(detail.all_permissions ?? []);
      const slugs = (detail.admin_roles || []).map((r) => r.slug).filter(Boolean);
      setAdminRoleSlugs(slugs);
    } catch {
      // On failure, deny all permissions. The backend enforces real auth.
      // Never grant full access on error — that would be a security hole.
      setPermissions([]);
      setAdminRoleSlugs([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  /**
   * isSuperAdmin — true when the user explicitly holds super_admin role,
   * OR when the backend returned wildcard (*) permissions (bootstrap mode).
   */
  const isSuperAdmin = useMemo(
    () =>
      adminRoleSlugs.includes('super_admin') ||
      permissions.includes('*'),
    [adminRoleSlugs, permissions],
  );

  /**
   * can(permissionSlug) — returns true if the user has the given permission.
   * Super Admin always returns true.
   */
  const can = useCallback(
    (permissionSlug) => {
      if (isSuperAdmin) return true;
      if (permissions.includes('*')) return true;
      return permissions.includes(permissionSlug);
    },
    [isSuperAdmin, permissions],
  );

  /**
   * canAny(...slugs) — true if the user has at least one of the given permissions.
   */
  const canAny = useCallback(
    (...slugs) => slugs.some((s) => can(s)),
    [can],
  );

  /**
   * canAll(...slugs) — true if the user has all of the given permissions.
   */
  const canAll = useCallback(
    (...slugs) => slugs.every((s) => can(s)),
    [can],
  );

  return { can, canAny, canAll, isSuperAdmin, adminRoleSlugs, permissions, loading };
}
