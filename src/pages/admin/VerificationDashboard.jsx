import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Users, Clock, CheckCircle2, ArrowRight,
  AlertTriangle, Award, Briefcase,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/dashboard/StatCard';
import QuickActions from '../../components/dashboard/QuickActions';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, timeAgo } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function VerificationDashboard() {
  usePageTitle('Verification Dashboard');
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getDashboard();
      setData(response.data ?? response);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (loading) return <DashboardSkeleton />;
  if (error || !data) return <ErrorState title="Unable to load dashboard" description={error} onRetry={loadDashboard} />;

  const firstName = (user?.name || 'Verification Admin').split(' ')[0];

  const s = {
    pendingVerifications: data.pending_verifications ?? 0,
    totalFreelancers: data.total_freelancers ?? 0,
    totalUsers: data.total_users ?? 0,
    totalJobs: data.total_jobs ?? 0,
    openJobs: data.open_jobs ?? 0,
    completedJobs: data.completed_jobs ?? 0,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-500">
            Review credentials, verifications, and freelancer approvals.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-violet-500" aria-hidden="true" />
          Verification Panel
        </div>
      </div>

      {/* Pending alerts */}
      {s.pendingVerifications > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warning-200 bg-warning-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning-600" aria-hidden="true" />
          <p className="text-sm font-medium text-warning-800">
            {s.pendingVerifications} verification{s.pendingVerifications !== 1 ? 's' : ''} awaiting review
          </p>
          <Link to="/admin/verifications" className="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2.5 py-0.5 text-xs font-bold text-warning-800 hover:bg-warning-200">
            Review now <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={ShieldCheck} label="Pending Reviews" value={s.pendingVerifications} hint="Credentials & verifications" tone={s.pendingVerifications > 0 ? 'brand' : 'ink'} />
        <StatCard icon={Users} label="Total Freelancers" value={s.totalFreelancers.toLocaleString()} hint="Registered on platform" tone="brand" />
        <StatCard icon={Award} label="Freelancer Pool" value={s.totalFreelancers.toLocaleString()} hint="Active talent" tone="emerald" />
        <StatCard icon={Briefcase} label="Open Jobs" value={s.openJobs} hint={`${s.totalJobs} total`} tone="brand" />
      </div>

      {/* Quick Actions */}
      <QuickActions items={[
        { label: 'Verifications', description: `${s.pendingVerifications} pending reviews`, to: '/admin/verifications', icon: ShieldCheck },
        { label: 'Freelancer Approvals', description: 'Review freelancer profiles', to: '/admin/freelancers', icon: Users },
        { label: 'Users', description: `${s.totalUsers.toLocaleString()} total`, to: '/admin/users', icon: Users },
        { label: 'Jobs', description: `${s.openJobs} open`, to: '/admin/jobs', icon: Briefcase },
      ]} />
    </div>
  );
}
