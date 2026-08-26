import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GoogleIcon from '../../components/common/GoogleIcon';
import { PageLoader } from '../../components/common/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getDashboardPath } from '../../utils/auth';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';

export default function LoginPage() {
  usePageTitle('Sign In');
  const { user, loading, login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  // While an existing session is being verified, don't redirect yet — this
  // avoids a flash of the form (or a stale dashboard) during hydration.
  if (loading) return <PageLoader label={t('login.checkingSession')} />;

  // Already signed in — send the visitor to their destination.
  if (user) {
    return <Navigate to={from ?? getDashboardPath(user.role, user)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError(null);
    setSubmitting(true);
    try {
      // `remember` decides the local persistence scope: localStorage for
      // remembered sessions, sessionStorage otherwise. The backend token is
      // identical either way — see utils/authStorage.js.
      const authedUser = await login({
        email: email.trim(),
        password,
        remember: rememberMe,
      });
      // On success the provider has stored the session; go to the page the
      // visitor came from (set by ProtectedRoute) or their role dashboard.
      navigate(from ?? getDashboardPath(authedUser.role, authedUser), { replace: true });
    } catch (error) {
      const errors = getFieldErrors(error);
      // Backend puts bad credentials under `email`, missing/weak input under
      // `email`/`password`, and blocked accounts under `account` — show the
      // first two under their fields, `account` (and everything else) as a banner.
      const known = {};
      if (errors.email) known.email = errors.email;
      if (errors.password) known.password = errors.password;
      setFieldErrors(known);
      const hasFieldErrors = Object.keys(known).length > 0;
      setGeneralError(
        errors.account ||
          (hasFieldErrors ? null : getErrorMessage(error, 'Unable to sign in. Please try again.')),
      );
      setSubmitting(false);
    }
  };

  const checkboxClass =
    'h-4 w-4 shrink-0 rounded border-gray-300 text-brand-600 transition-colors focus:ring-brand-500/30 focus:outline-none focus-visible:ring-2';

  return (
    <Card>
      <div className="px-6 pb-6 pt-8 sm:px-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500">
          <LogIn className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink-900">{t('login.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('login.description')}</p>

        {/* Google sign-in — coming soon, no backend endpoint */}
        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            className="w-full opacity-60 cursor-not-allowed"
            disabled
            aria-disabled="true"
            title={t('login.googleSoon')}
          >
            <GoogleIcon className="h-4 w-4" />
            {t('login.googleContinue')}
          </Button>
          <p
            role="status"
            aria-live="polite"
            className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-center text-xs text-gray-500"
          >
            {t('login.googleSoon')}
          </p>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {t('login.orContinueWith')}
          </span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        {generalError && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700"
          >
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <Input
            type="email"
            label={t('login.email')}
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
            disabled={submitting}
            required
          />
          <Input
            type="password"
            label={t('login.password')}
            name="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            disabled={submitting}
            required
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className={checkboxClass}
                disabled={submitting}
              />
              {t('login.rememberMe')}
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              {t('login.forgotPassword')}
            </Link>
          </div>
          <Button type="submit" loading={submitting} className="w-full">
            {t('login.signIn')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t('login.newTo')}{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
            {t('login.createAccount')}
          </Link>
        </p>
      </div>
    </Card>
  );
}
