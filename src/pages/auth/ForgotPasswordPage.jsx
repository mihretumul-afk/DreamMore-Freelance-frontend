import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { usePageTitle } from '../../hooks/usePageTitle';

/**
 * Password recovery is NOT wired to a real flow: the Laravel backend exposes
 * no password-reset endpoints (no forgot/reset routes in routes/api.php), so
 * this page honestly states that the feature is unavailable instead of
 * pretending to send reset links.
 */
export default function ForgotPasswordPage() {
  usePageTitle('Reset Password');

  return (
    <Card>
      <div className="px-6 pb-6 pt-8 sm:px-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500">
          <KeyRound className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink-900">Reset your password</h1>
        <p className="mt-1 text-sm text-gray-500">
          Password recovery is coming soon.
        </p>

        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
          <p>
            The platform does not offer password recovery yet — the reset API has not shipped on
            the server side, so a reset link cannot be sent at this time.
          </p>
          <p className="mt-2">
            If you cannot sign in, please contact support for help restoring access to your
            account.
          </p>
        </div>

        <div className="mt-6">
          <Button as={Link} to="/login" variant="outline" className="w-full">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to sign in
          </Button>
        </div>
      </div>
    </Card>
  );
}
