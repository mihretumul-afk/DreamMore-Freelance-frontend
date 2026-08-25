import { Navigate, Outlet } from 'react-router-dom';
import { usePlatform } from '../hooks/usePlatform';
import { useAuth } from '../hooks/useAuth';
import { PageLoader } from '../components/common/Loading';

/**
 * Route guard that redirects to the maintenance page when maintenance
 * mode is enabled.
 *
 * Admin users always bypass this check.
 * Non-admin users who are already logged in (freelancer/employer) are
 * also redirected — only unauthenticated public visitors see the
 * maintenance page for marketplace routes.
 *
 * IMPORTANT: This guard must NOT wrap the /login route. The login page
 * must always be accessible so the admin can authenticate and disable
 * maintenance mode.
 */
export default function MaintenanceRoute() {
  const { settings, loading: settingsLoading } = usePlatform();
  const { user, loading: authLoading } = useAuth();

  if (settingsLoading || authLoading) {
    return <PageLoader label="Checking platform status…" />;
  }

  // Admin users always bypass maintenance mode
  if (user?.role === 'admin') {
    return <Outlet />;
  }

  // Redirect to maintenance page if maintenance mode is enabled
  if (settings.maintenance_mode) {
    return <Navigate to="/maintenance" replace />;
  }

  return <Outlet />;
}
