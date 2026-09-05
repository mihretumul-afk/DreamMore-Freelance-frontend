import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { usePageTitle } from '../../hooks/usePageTitle';
import { authService } from '../../services/authService';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';

export default function ResetPasswordPage() {
  usePageTitle('Reset Password');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  // Validation if token or email are missing from the URL
  const isLinkInvalid = !token || !email;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    const errors = {};
    if (!password) {
      errors.password = 'Please enter a new password.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (!passwordConfirmation) {
      errors.password_confirmation = 'Please confirm your new password.';
    } else if (password !== passwordConfirmation) {
      errors.password_confirmation = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      await authService.resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    } catch (error) {
      const serverFieldErrors = getFieldErrors(error);
      if (Object.keys(serverFieldErrors).length > 0) {
        setFieldErrors(serverFieldErrors);
      } else {
        setGeneralError(
          getErrorMessage(
            error,
            'Failed to reset password. The link may have expired or is invalid.'
          )
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isLinkInvalid) {
    return (
      <Card>
        <div className="px-6 pb-6 pt-8 sm:px-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-500">
            <AlertCircle className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink-900">
            Invalid Password Reset Link
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            This password reset link is invalid or incomplete because the required token or email is missing.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 text-xs text-warning-800">
              Please verify that you clicked the exact URL sent to your email address, or request a new password reset link.
            </div>

            <Button as={Link} to="/forgot-password" className="w-full">
              Request New Reset Link
            </Button>
            <Button as={Link} to="/login" variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Sign In
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="px-6 pb-6 pt-8 sm:px-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500">
          <KeyRound className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink-900">
          Create new password
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter a new secure password for <span className="font-semibold text-ink-900">{email}</span>.
        </p>

        {success ? (
          <div className="mt-6 space-y-6">
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-start gap-3"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-emerald-900">Password reset successfully!</p>
                <p className="mt-1 text-xs text-emerald-700">
                  Your password has been updated. You will be redirected to the sign in page in a moment...
                </p>
              </div>
            </div>

            <Button as={Link} to="/login" className="w-full">
              Go to Sign In Now
            </Button>
          </div>
        ) : (
          <>
            {generalError && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700"
              >
                {generalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="New password"
                  name="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={fieldErrors.password}
                  disabled={submitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Confirm new password"
                  name="password_confirmation"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  error={fieldErrors.password_confirmation}
                  disabled={submitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 p-1"
                  aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500 space-y-1 border border-gray-100">
                <p className="font-semibold text-gray-700">Password Requirements:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li className={password.length >= 8 ? 'text-emerald-600 font-medium' : ''}>
                    At least 8 characters long
                  </li>
                  <li className={password && password === passwordConfirmation ? 'text-emerald-600 font-medium' : ''}>
                    Passwords must match
                  </li>
                </ul>
              </div>

              <Button type="submit" loading={submitting} className="w-full">
                Reset Password
              </Button>

              <div className="pt-2">
                <Button as={Link} to="/login" variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Cancel & Back to Sign In
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </Card>
  );
}
