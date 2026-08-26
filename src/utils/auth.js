import { ROLES } from '../constants/app';

/** Human-readable labels for the backend role values. */
export const ROLE_LABELS = {
  [ROLES.FREELANCER]: 'Freelancer',
  [ROLES.EMPLOYER]: 'Employer',
  [ROLES.ADMIN]: 'Admin',
};

/** Admin sub-role slug → dashboard path mapping. */
const ADMIN_ROLE_DASHBOARDS = {
  super_admin: '/admin/dashboard',
  support_admin: '/admin/support/dashboard',
  finance_admin: '/admin/finance/dashboard',
  dispute_admin: '/admin/disputes/dashboard',
  verification_admin: '/admin/verification/dashboard',
};

/**
 * Resolve the admin sub-role slug from the user object.
 * The user may have multiple roles; we pick the most specific one.
 */
function getAdminSubRole(user) {
  const roles = user?.admin_roles;
  if (!Array.isArray(roles) || roles.length === 0) return null;

  // Priority: super_admin > specific role > first role
  if (roles.some((r) => r.slug === 'super_admin')) return 'super_admin';
  if (roles.some((r) => r.slug === 'support_admin')) return 'support_admin';
  if (roles.some((r) => r.slug === 'finance_admin')) return 'finance_admin';
  if (roles.some((r) => r.slug === 'dispute_admin')) return 'dispute_admin';
  if (roles.some((r) => r.slug === 'verification_admin')) return 'verification_admin';
  return roles[0]?.slug ?? null;
}

/**
 * Default destination for a signed-in user based on their backend role.
 * For admins, detects the sub-role and redirects to the appropriate dashboard.
 * @param {string} role backend role value ('freelancer' | 'employer' | 'admin')
 * @param {object} [user] full user object (needed for admin sub-role detection)
 */
export function getDashboardPath(role, user) {
  switch (role) {
    case ROLES.ADMIN: {
      const subRole = getAdminSubRole(user);
      return (subRole && ADMIN_ROLE_DASHBOARDS[subRole]) || '/admin/dashboard';
    }
    case ROLES.EMPLOYER:
      return '/employer/dashboard';
    case ROLES.FREELANCER:
      return '/freelancer/dashboard';
    default:
      return '/';
  }
}

/**
 * Role-based path to the user's own profile page, or null when the role has
 * no profile route (admin).
 */
export function getProfilePath(role) {
  switch (role) {
    case ROLES.EMPLOYER:
      return '/employer/profile';
    case ROLES.FREELANCER:
      return '/freelancer/profile';
    default:
      return null;
  }
}

/**
 * Navbar/menu destinations for an authenticated user.
 * Admin gets a dashboard link but no profile link.
 */
export function getNavPaths(role, user) {
  return { dashboardPath: getDashboardPath(role, user), profilePath: getProfilePath(role) };
}
