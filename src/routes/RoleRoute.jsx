import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PageLoader } from '../components/common/Loading';
import { getDashboardPath } from '../utils/auth';

/**
 * Restricts its children to the given backend roles. Users without the right
 * role are sent to their own dashboard (or the home page if they have none).
 *
 * Shows a loader while the session is still initializing so users are never
 * bounced before auth state is known.
 * @param {string[]} roles
 */
export default function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader label="Checking session…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role, user)} replace />;
  }
  return children;
}
