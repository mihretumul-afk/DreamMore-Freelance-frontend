import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, ShieldCheck, Flag, Briefcase, Clock, CheckCircle2,
  AlertTriangle, ArrowRight, UserCheck, MessageSquare,
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

const statusTone = {
  active: 'success', pending: 'warning', suspended: 'danger',
  rejected: 'danger', completed: 'info',
};

export default function SupportDashboard() {
  usePageTitle('Support Dashboard');
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

  const firstName = (user?.name || 'Support Admin').split(' ')[0];

  const s = {
    totalUsers: data.total_users ?? 0,
    totalFreelancers: data.total_freelancers ?? 0,
    totalEmployers: data.total_employers ?? 0,
    pendingVerifications: data.pending_verifications ?? 0,
    pendingReports: data.pending_reports ?? 0,
    totalJobs: data.total_jobs ?? 0,
    openJobs: data.open_jobs ?? 0,
  };

  const recentUsers = (data.recent_users ?? []).slice(0, 8);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-500">
            Manage users, verifications, and support requests.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" aria-hidden="true" />
          Support Panel
        </div>
      </div>

      {/* Pending alerts */}
      {(s.pendingVerifications > 0 || s.pendingReports > 0) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warning-200 bg-warning-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning-600" aria-hidden="true" />
          <p className="text-sm font-medium text-warning-800">
            Pending actions require your attention:
          </p>
          <div className="flex flex-wrap gap-2">
            {s.pendingVerifications > 0 && (
              <Link to="/admin/verifications" className="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2.5 py-0.5 text-xs font-bold text-warning-800 hover:bg-warning-200">
                {s.pendingVerifications} verification{s.pendingVerifications !== 1 ? 's' : ''}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
            {s.pendingReports > 0 && (
              <Link to="/admin/reports" className="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2.5 py-0.5 text-xs font-bold text-warning-800 hover:bg-warning-200">
                {s.pendingReports} report{s.pendingReports !== 1 ? 's' : ''}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={s.totalUsers.toLocaleString()} hint={`${s.totalFreelancers} freelancers · ${s.totalEmployers} employers`} />
        <StatCard icon={ShieldCheck} label="Pending Verifications" value={s.pendingVerifications} hint="Awaiting review" tone={s.pendingVerifications > 0 ? 'brand' : 'ink'} />
        <StatCard icon={Flag} label="Open Reports" value={s.pendingReports} hint="Awaiting resolution" tone={s.pendingReports > 0 ? 'brand' : 'ink'} />
        <StatCard icon={Briefcase} label="Open Jobs" value={s.openJobs} hint={`${s.totalJobs} total`} tone="brand" />
      </div>

      {/* Quick Actions */}
      <QuickActions items={[
        { label: 'Manage Users', description: `${s.totalUsers.toLocaleString()} total`, to: '/admin/users', icon: Users },
        { label: 'Verifications', description: `${s.pendingVerifications} pending`, to: '/admin/verifications', icon: ShieldCheck },
        { label: 'Reports', description: `${s.pendingReports} pending`, to: '/admin/reports', icon: Flag },
        { label: 'Jobs', description: `${s.openJobs} open`, to: '/admin/jobs', icon: Briefcase },
      ]} />

      {/* Recent Users */}
      <Card>
        <CardHeader
          title="Recent Users"
          description="Latest user registrations."
          action={
            <Link to="/admin/users" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <CardBody className="p-0">
          {recentUsers.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {recentUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                      {(u.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <Link to={`/admin/users/${u.id}`} className="block truncate text-sm font-semibold text-ink-900 hover:text-brand-600">
                        {u.name}
                      </Link>
                      <p className="truncate text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge tone={statusTone[u.role] ?? 'neutral'} size="xs">{u.role}</Badge>
                    <Badge tone={statusTone[u.status] ?? 'neutral'} size="xs" dot>{u.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No recent users.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
