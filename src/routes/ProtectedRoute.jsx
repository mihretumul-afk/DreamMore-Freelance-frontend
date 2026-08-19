import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PageLoader } from '../components/common/Loading';

/**
 * Layout-level guard: renders child routes only for authenticated users.
 * Unauthenticated visitors are redirected to /login with their origin stored
 * so the auth phase can send them back after signing in.
 */
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Checking session…" />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
