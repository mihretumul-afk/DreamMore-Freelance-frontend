import { ROLES } from '../constants/app';

/** Human-readable labels for the backend role values. */
export const ROLE_LABELS = {
  [ROLES.FREELANCER]: 'Freelancer',
  [ROLES.EMPLOYER]: 'Employer',
  [ROLES.ADMIN]: 'Admin',
};

/**
 * Default destination for a signed-in user based on their backend role.
 * @param {string} role backend role value ('freelancer' | 'employer' | 'admin')
 */
export function getDashboardPath(role) {
  switch (role) {
    case ROLES.ADMIN:
      return '/admin/dashboard';
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
export function getNavPaths(role) {
  return { dashboardPath: getDashboardPath(role), profilePath: getProfilePath(role) };
}
