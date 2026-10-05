import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PageLoader } from '../components/common/Loading';
import { getDashboardPath } from '../utils/auth';

/**
 * Restricts its children to the given backend roles. Users without the right
 * role are sent to their own dashboard (or the home page if they have none).
 *
 * For freelancers: unapproved freelancers are restricted to credentials and profile
 * until an admin approves their profile/credentials.
 */
export default function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Checking session…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role, user)} replace />;
  }

  if (user.role === 'freelancer') {
    const isApproved = Boolean(user.is_fully_approved || user.profile_approval_status === 'approved');
    if (!isApproved) {
      const allowedPaths = ['/freelancer/credentials', '/freelancer/profile'];
      const isAllowed = allowedPaths.some((p) => location.pathname === p || location.pathname.startsWith(p));
      if (!isAllowed) {
        return <Navigate to="/freelancer/credentials" replace state={{ pendingApproval: true }} />;
      }
    } else if (location.pathname === '/freelancer/credentials') {
      // Once approved by admin, credentials page is no longer necessary — redirect to dashboard
      return <Navigate to="/freelancer/dashboard" replace />;
    }
  }

  return children;
}
