import { useCallback, useEffect, useState } from 'react';
import { Mail, Lock, ShieldCheck, Eye, EyeOff, Save } from 'lucide-react';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { adminService } from '../../services/adminService';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';

/** Small inline toggle for password visibility. */
function PasswordToggle({ visible, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      tabIndex={-1}
      aria-label={visible ? 'Hide password' : 'Show password'}
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

/** Reusable password input with show/hide toggle. */
function PasswordField({ label, error, required, id, className, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink-800">
          {label}
          {required && (
            <span className="text-danger-500" aria-hidden="true"> *</span>
          )}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required={required || undefined}
          aria-required={required || undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-input border bg-white px-3.5 py-2.5 pr-10 text-sm text-ink-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${
            error
              ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20'
              : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500/20'
          } ${className || ''}`}
          {...props}
        />
        <PasswordToggle visible={visible} onClick={() => setVisible(!visible)} />
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function AdminSecurityPage() {
  usePageTitle('Account & Security — Admin');
  const { showToast } = useToast();

  // Account info
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Email form
  const [emailForm, setEmailForm] = useState({ email: '', current_password: '' });
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailErrors, setEmailErrors] = useState({});
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // ── Load account info ──────────────────────────────────────────────
  const loadAccount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getAccountSecurity();
      const data = response.data ?? response;
      setAccount(data);
      setEmailForm((prev) => ({ ...prev, email: data.email || '' }));
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load account information.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  // ── Email update handler ───────────────────────────────────────────
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailSaving(true);
    setEmailErrors({});
    setEmailSuccess(false);
    try {
      const response = await adminService.updateAdminEmail(emailForm);
      const data = response.data ?? response;
      setAccount((prev) => (prev ? { ...prev, email: data.email } : prev));
      setEmailForm((prev) => ({ ...prev, current_password: '' }));
      setEmailErrors({});
      setEmailSuccess(true);
      showToast('Email address updated successfully.', 'success');
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (err) {
      if (err?.response?.status === 422) {
        setEmailErrors(getFieldErrors(err));
        showToast('Please fix the validation errors.', 'error');
      } else {
        showToast(getErrorMessage(err, 'Unable to update email.'), 'error');
      }
    } finally {
      setEmailSaving(false);
    }
  };

  // ── Password update handler ────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordErrors({});
    setPasswordSuccess(false);
    try {
      await adminService.updateAdminPassword(passwordForm);
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      setPasswordErrors({});
      setPasswordSuccess(true);
      showToast('Password changed successfully. Other sessions have been invalidated.', 'success');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      if (err?.response?.status === 422) {
        setPasswordErrors(getFieldErrors(err));
        showToast('Please fix the validation errors.', 'error');
      } else {
        showToast(getErrorMessage(err, 'Unable to change password.'), 'error');
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  // ── Input handlers ─────────────────────────────────────────────────
  const updateEmailField = (key) => (e) => {
    setEmailForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (emailErrors[key]) {
      setEmailErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const updatePasswordField = (key) => (e) => {
    setPasswordForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (passwordErrors[key]) {
      setPasswordErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-64 animate-pulse rounded-card border border-gray-200 bg-white" />
        <div className="h-64 animate-pulse rounded-card border border-gray-200 bg-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 px-6 py-16 text-center">
        <p className="text-sm font-semibold text-ink-900">Unable to load account settings</p>
        <p className="mt-1 max-w-sm text-sm text-gray-600">{error}</p>
        <Button variant="outline" size="sm" onClick={loadAccount} className="mt-5">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Account & Security</h1>
        <p className="text-sm text-gray-500">
          Manage your admin account email and password.
        </p>
      </div>

      {/* Account Info Display */}
      {account && (
        <Card>
          <CardHeader
            title="Current Account"
            description="Your admin account details."
          />
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                <ShieldCheck className="h-6 w-6 text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">{account.name}</p>
                <p className="text-sm text-gray-500">{account.email}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {account.admin_roles?.map((role) => (
                    <Badge key={role} tone="info" size="sm">
                      {role.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Change Email Card ──────────────────────────────────────── */}
      <Card>
        <CardHeader
          title="Change Email Address"
          description="Update the email address associated with your admin account."
        />
        <CardBody>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <Input
              label="New email address"
              type="email"
              id="security-email"
              value={emailForm.email}
              onChange={updateEmailField('email')}
              error={emailErrors.email}
              icon={Mail}
              required
            />
            <PasswordField
              label="Current password"
              id="security-email-password"
              value={emailForm.current_password}
              onChange={updateEmailField('current_password')}
              error={emailErrors.current_password}
              required
              autoComplete="current-password"
            />
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" loading={emailSaving} variant="secondary">
                <Save className="h-4 w-4" /> Update Email
              </Button>
              {emailSuccess && (
                <Badge tone="success" size="md">Email updated</Badge>
              )}
            </div>
          </form>
        </CardBody>
      </Card>

      {/* ── Change Password Card ──────────────────────────────────── */}
      <Card>
        <CardHeader
          title="Change Password"
          description="Ensure your account stays secure with a strong password."
        />
        <CardBody>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <PasswordField
              label="Current password"
              id="security-pw-current"
              value={passwordForm.current_password}
              onChange={updatePasswordField('current_password')}
              error={passwordErrors.current_password}
              required
              autoComplete="current-password"
            />
            <PasswordField
              label="New password"
              id="security-pw-new"
              value={passwordForm.password}
              onChange={updatePasswordField('password')}
              error={passwordErrors.password}
              required
              autoComplete="new-password"
              hint="Must be at least 8 characters with uppercase, lowercase, and numbers."
            />
            <PasswordField
              label="Confirm new password"
              id="security-pw-confirm"
              value={passwordForm.password_confirmation}
              onChange={updatePasswordField('password_confirmation')}
              error={passwordErrors.password_confirmation}
              required
              autoComplete="new-password"
            />
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" loading={passwordSaving} variant="danger">
                <Lock className="h-4 w-4" /> Change Password
              </Button>
              {passwordSuccess && (
                <Badge tone="success" size="md">Password changed</Badge>
              )}
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
