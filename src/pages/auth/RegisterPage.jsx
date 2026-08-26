import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { UserPlus, Lock } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import { PageLoader } from '../../components/common/Loading';
import { useAuth } from '../../hooks/useAuth';
import { usePlatform } from '../../hooks/usePlatform';
import { useI18n } from '../../i18n';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ROLES } from '../../constants/app';
import { getDashboardPath } from '../../utils/auth';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';

/** Fields the backend RegisterRequest accepts (and their max lengths). */
const FIELD_KEYS = ['name', 'email', 'password', 'role', 'phone', 'bio'];

export default function RegisterPage() {
  usePageTitle('Create Account');
  const { user, loading, register } = useAuth();
  const { settings } = usePlatform();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.FREELANCER,
    phone: '',
    bio: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  // While an existing session is being verified, don't redirect yet.
  if (loading) return <PageLoader label={t('login.checkingSession')} />;

  // Already signed in — send the visitor to their dashboard.
  if (user) {
    return <Navigate to={getDashboardPath(user.role, user)} replace />;
  }

  // Registration is closed
  if (settings.registration_open === false) {
    return (
      <Card>
        <div className="px-6 pb-6 pt-8 sm:px-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-warning-100">
            <Lock className="h-5 w-5 text-warning-600" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink-900">
            Registration Closed
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            New account registration is currently closed. Please try again later or contact support.
          </p>
          <Button as={Link} to="/login" className="mt-6">
            Sign In Instead
          </Button>
        </div>
      </Card>
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear a field error as soon as the user corrects the field.
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError(null);
    setSubmitting(true);

    // Only send fields the backend actually accepts; keep optional ones
    // empty (they become null server-side).
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      phone: form.phone.trim() || null,
      bio: form.bio.trim() || null,
    };

    try {
      const newUser = await register(payload);
      // Session stored by the provider — go straight to the role dashboard.
      navigate(getDashboardPath(newUser.role, newUser), { replace: true });
    } catch (error) {
      const errors = getFieldErrors(error);
      const known = {};
      FIELD_KEYS.forEach((key) => {
        if (errors[key]) known[key] = errors[key];
      });
      setFieldErrors(known);
      const hasFieldErrors = Object.keys(known).length > 0;
      setGeneralError(
        hasFieldErrors
          ? null
          : getErrorMessage(error, 'Unable to create your account. Please try again.'),
      );
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <div className="px-6 pb-6 pt-8 sm:px-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500">
          <UserPlus className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink-900">
          {t('register.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t('register.description')}</p>

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
            label={t('register.fullName')}
            name="name"
            placeholder={t('register.namePlaceholder')}
            autoComplete="name"
            maxLength={255}
            value={form.name}
            onChange={handleChange}
            error={fieldErrors.name}
            disabled={submitting}
            required
          />
          <Input
            type="email"
            label={t('login.email')}
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            maxLength={255}
            value={form.email}
            onChange={handleChange}
            error={fieldErrors.email}
            disabled={submitting}
            required
          />
          <Input
            type="password"
            label={t('login.password')}
            name="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={handleChange}
            error={fieldErrors.password}
            hint={t('register.passwordHint')}
            disabled={submitting}
            required
          />
          <Select
            label={t('register.iAm')}
            name="role"
            value={form.role}
            onChange={handleChange}
            error={fieldErrors.role}
            disabled={submitting}
            required
          >
            <option value={ROLES.FREELANCER}>{t('register.freelancerOption')}</option>
            <option value={ROLES.EMPLOYER}>{t('register.employerOption')}</option>
          </Select>
          <Input
            label={t('register.phone')}
            name="phone"
            type="tel"
            placeholder="+251 9 00 000 000"
            autoComplete="tel"
            maxLength={50}
            value={form.phone}
            onChange={handleChange}
            error={fieldErrors.phone}
            disabled={submitting}
          />
          <Textarea
            label={t('register.bio')}
            name="bio"
            placeholder={t('register.bioPlaceholder')}
            rows={3}
            maxLength={1000}
            value={form.bio}
            onChange={handleChange}
            error={fieldErrors.bio}
            disabled={submitting}
          />
          <Button type="submit" loading={submitting} className="w-full">
            {t('register.createAccount')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t('register.alreadyHave')}{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            {t('register.signIn')}
          </Link>
        </p>
      </div>
    </Card>
  );
}
