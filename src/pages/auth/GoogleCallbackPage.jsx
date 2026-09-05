import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, LogIn } from 'lucide-react';
import Card from '../../components/ui/Card';
import GoogleIcon from '../../components/common/GoogleIcon';
import { PageLoader } from '../../components/common/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
import { setSession } from '../../utils/authStorage';
import { getDashboardPath } from '../../utils/auth';

/**
 * Destination of the Google OAuth callback (backend bounces the browser here
 * with ?token=…&new=0|1, or ?error=… on failure).
 *
 * New users (new=1) are sent to /auth/choose-role to pick freelancer or
 * employer; returning users go straight to their dashboard.
 */
export default function GoogleCallbackPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const oauthError = searchParams.get('error');
    const token = searchParams.get('token');
    const isNew = searchParams.get('new') === '1';

    if (oauthError) {
      setError(oauthError);
      return;
    }

    if (!token) {
      setError(t('google.failed'));
      return;
    }

    (async () => {
      try {
        // Persist the token first so the API client attaches it, then fetch
        // the real user (GET /auth/me) which updates auth state + storage.
        setSession(token, {}, true);
        const user = await refreshUser();

        if (isNew) {
          // Brand-new Google account — ask freelancer vs employer.
          navigate('/auth/choose-role', { replace: true });
        } else {
          navigate(getDashboardPath(user.role, user), { replace: true });
        }
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            t('google.failed'),
        );
      }
    })();
  }, [navigate, refreshUser, searchParams, t]);

  if (error) {
    return (
      <Card>
        <div className="px-6 pb-6 pt-8 sm:px-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-50">
            <AlertCircle className="h-5 w-5 text-danger-600" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink-900">
            {t('google.failed')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <Link
            to="/login"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            <LogIn className="h-4 w-4" />
            {t('google.backToLogin')}
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-col items-center px-6 pb-6 pt-10 text-center sm:px-8">
        <GoogleIcon className="h-10 w-10" />
        <p className="mt-5 text-lg font-semibold text-ink-900">
          {t('google.signingIn')}
        </p>
        <div className="mt-4">
          <PageLoader label={t('google.signingIn')} />
        </div>
      </div>
    </Card>
  );
}