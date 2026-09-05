import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound, Mail, CheckCircle2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { usePageTitle } from '../../hooks/usePageTitle';
import { authService } from '../../services/authService';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';

export default function ForgotPasswordPage() {
  usePageTitle('Forgot Password');

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFieldErrors({ email: 'Please enter your email address.' });
      return;
    }

    setSubmitting(true);

    try {
      await authService.forgotPassword(trimmedEmail);
      setSubmitted(true);
    } catch (error) {
      const errors = getFieldErrors(error);
      if (errors.email) {
        setFieldErrors({ email: errors.email });
      } else {
        setGeneralError(
          getErrorMessage(error, 'Unable to send password reset link. Please try again.')
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <div className="px-6 pb-6 pt-8 sm:px-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500">
          <KeyRound className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink-900">
          {submitted ? 'Check your email' : 'Forgot your password?'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {submitted
            ? 'We have sent password reset instructions to your email address.'
            : 'Enter the email associated with your DreamMore account and we will send you a reset link.'}
        </p>

        {submitted ? (
          <div className="mt-6 space-y-6">
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-start gap-3"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-emerald-900">
                  Password reset link sent. Please check your email.
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  If an account exists for <span className="font-mono font-bold">{email}</span>, you will receive an email shortly with instructions to reset your password.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-500 space-y-2">
              <p className="font-medium text-ink-900">Didn't receive the email?</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Check your spam or junk mail folder.</li>
                <li>Make sure you entered the correct email address.</li>
                <li>Wait a few minutes before trying again.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSubmitted(false)}
                className="w-full"
              >
                <Mail className="h-4 w-4" aria-hidden="true" /> Send link to another email
              </Button>
              <Button as={Link} to="/login" variant="ghost" className="w-full">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Return to Sign In
              </Button>
            </div>
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
              <Input
                type="email"
                label="Email address"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={fieldErrors.email}
                disabled={submitting}
                required
              />

              <Button type="submit" loading={submitting} className="w-full">
                Send Reset Link
              </Button>

              <div className="pt-2">
                <Button as={Link} to="/login" variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Sign In
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </Card>
  );
}
