import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDashboardPath } from '../utils/auth';

/**
 * AdminRedirect — redirects /admin/ to the correct role-specific dashboard.
 * Uses getDashboardPath which detects the admin's sub-role from admin_roles.
 */
export default function AdminRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const dashboardPath = getDashboardPath(user.role, user);
  return <Navigate to={dashboardPath} replace />;
}
