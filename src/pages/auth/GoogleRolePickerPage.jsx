import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, UserRound } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';
import { authService } from '../../services/authService';
import { getDashboardPath } from '../../utils/auth';
import { getErrorMessage } from '../../utils/errors';
import GoogleIcon from '../../components/common/GoogleIcon';

/**
 * Shown once, right after a brand-new Google sign-up. The backend created the
 * account without a role/profile; picking one here creates the matching
 * profile and drops the user into the right dashboard.
 */
export default function GoogleRolePickerPage() {
  usePageTitle('Choose Your Role');
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [submitting, setSubmitting] = useState(null); // 'freelancer' | 'employer' | null

  const chooseRole = async (role) => {
    setSubmitting(role);
    try {
      await authService.completeGoogleRole(role);
      const user = await refreshUser();
      if (user.role === 'freelancer') {
        navigate('/freelancer/credentials', { replace: true, state: { newlyRegistered: true } });
      } else {
        navigate(getDashboardPath(user.role, user), { replace: true });
      }
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to finish creating your account. Please try again.'), 'error');
      setSubmitting(null);
    }
  };

  const roleCardClass =
    'group w-full rounded-2xl border-2 border-gray-200 bg-white p-5 text-left transition-all duration-200 ' +
    'hover:border-brand-500 hover:shadow-lg disabled:opacity-60 disabled:cursor-wait';

  return (
    <Card>
      <div className="px-6 pb-6 pt-8 sm:px-8">
        <div className="flex flex-col items-center text-center">
          <GoogleIcon className="h-10 w-10" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink-900">
            {t('google.roleTitle')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t('google.roleDescription')}</p>
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => chooseRole('freelancer')}
            disabled={submitting !== null}
            className={roleCardClass}
          >
            <span className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                <Briefcase className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="block text-base font-bold text-ink-900">
                  {t('google.freelancer')}
                </span>
                <span className="mt-0.5 block text-sm text-gray-500">
                  {t('google.freelancerDesc')}
                </span>
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => chooseRole('employer')}
            disabled={submitting !== null}
            className={roleCardClass}
          >
            <span className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                <UserRound className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="block text-base font-bold text-ink-900">
                  {t('google.employer')}
                </span>
                <span className="mt-0.5 block text-sm text-gray-500">
                  {t('google.employerDesc')}
                </span>
              </span>
            </span>
          </button>
        </div>

        <div className="mt-6">
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/login', { replace: true })}
          >
            {t('google.backToLogin')}
          </Button>
        </div>
      </div>
    </Card>
  );
}