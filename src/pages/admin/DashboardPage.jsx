import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Briefcase, Handshake, Banknote, ShieldCheck, Flag,
  UserCheck, AlertTriangle, TrendingUp, Clock, CheckCircle2,
  XCircle, Activity, ArrowRight, CreditCard, Milestone,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/dashboard/StatCard';
import QuickActions from '../../components/dashboard/QuickActions';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';
import { adminService } from '../../services/adminService';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { getErrorMessage } from '../../utils/errors';
import { formatETB, formatDate, timeAgo } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import { cn } from '../../utils/cn';

const statusTone = {
  active: 'success', open: 'success', pending: 'warning', pending_verification: 'warning',
  suspended: 'danger', cancelled: 'danger', rejected: 'danger',
  completed: 'info', in_progress: 'primary',
};

export default function AdminDashboardPage() {
  usePageTitle('Admin Dashboard');
  const { user } = useAuth();
  const { can, isSuperAdmin } = useAdminPermissions();

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

  const firstName = (user?.name || 'Admin').split(' ')[0];

  const s = {
    totalUsers:           data.total_users ?? 0,
    totalFreelancers:     data.total_freelancers ?? 0,
    totalEmployers:       data.total_employers ?? 0,
    totalAdmins:          data.total_admins ?? 0,
    totalJobs:            data.total_jobs ?? 0,
    openJobs:             data.open_jobs ?? data.active_jobs ?? 0,
    completedJobs:        data.completed_jobs ?? 0,
    totalProposals:       data.total_proposals ?? 0,
    totalContracts:       data.total_contracts ?? 0,
    activeContracts:      data.active_contracts ?? 0,
    completedContracts:   data.completed_contracts ?? 0,
    totalRevenue:         data.total_revenue ?? 0,
    totalCategories:      data.total_categories ?? 0,
    totalSkills:          data.total_skills ?? 0,
    pendingVerifications: data.pending_verifications ?? 0,
    pendingReports:       data.pending_reports ?? 0,
  };

  const recentUsers = (data.recent_users ?? []).slice(0, 6);
  const recentJobs  = (data.recent_jobs ?? []).slice(0, 6);

  // Build quick actions based on what the current admin can see
  const quickActions = [
    can('users.view')   && { label: 'Manage Users',    description: `${s.totalUsers.toLocaleString()} total`,        to: '/admin/users',         icon: Users },
    can('users.verify') && { label: 'Verifications',   description: `${s.pendingVerifications} pending reviews`,     to: '/admin/verifications', icon: ShieldCheck },
    can('disputes.view')&& { label: 'Reports',         description: `${s.pendingReports} pending`,                   to: '/admin/reports',       icon: Flag },
    can('jobs.view')    && { label: 'Jobs',             description: `${s.openJobs} open`,                            to: '/admin/jobs',          icon: Briefcase },
    can('admins.view')  && { label: 'Administrators',  description: 'Manage admin accounts',                          to: '/admin/administrators',icon: UserCheck },
    can('roles.view')   && { label: 'Roles',           description: 'Manage access roles',                            to: '/admin/roles',         icon: ShieldCheck },
  ].filter(Boolean);

  const hasAlerts = s.pendingVerifications > 0 || s.pendingReports > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-500">
            Here&apos;s what&apos;s happening on Dream More AppWorks right now.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-success-200 bg-success-50 px-3 py-1.5 text-xs font-semibold text-success-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success-500" aria-hidden="true" />
          System Online
        </div>
      </div>

      {/* Pending alerts banner */}
      {hasAlerts && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warning-200 bg-warning-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning-600" aria-hidden="true" />
          <p className="text-sm font-medium text-warning-800">
            Pending actions require your attention:
          </p>
          <div className="flex flex-wrap gap-2">
            {s.pendingVerifications > 0 && can('users.verify') && (
              <Link
                to="/admin/verifications"
                className="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2.5 py-0.5 text-xs font-bold text-warning-800 hover:bg-warning-200"
              >
                {s.pendingVerifications} verification{s.pendingVerifications !== 1 ? 's' : ''}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
            {s.pendingReports > 0 && can('disputes.view') && (
              <Link
                to="/admin/reports"
                className="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2.5 py-0.5 text-xs font-bold text-warning-800 hover:bg-warning-200"
              >
                {s.pendingReports} report{s.pendingReports !== 1 ? 's' : ''}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stats grid — show cards based on permission */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {can('users.view') && (
          <StatCard
            icon={Users}
            label="Total Users"
            value={s.totalUsers.toLocaleString()}
            hint={`${s.totalFreelancers} freelancers · ${s.totalEmployers} employers`}
          />
        )}
        {can('jobs.view') && (
          <StatCard
            icon={Briefcase}
            label="Total Jobs"
            value={s.totalJobs.toLocaleString()}
            hint={`${s.openJobs} open · ${s.completedJobs} completed`}
            tone="brand"
          />
        )}
        {(can('milestones.view') || can('disputes.view')) && (
          <StatCard
            icon={Handshake}
            label="Active Contracts"
            value={s.activeContracts.toLocaleString()}
            hint={`${s.completedContracts} completed`}
            tone="emerald"
          />
        )}
        {can('transactions.view') && (
          <StatCard
            icon={Banknote}
            label="Total Revenue"
            value={formatETB(s.totalRevenue)}
            hint="Platform-wide"
            tone="emerald"
          />
        )}
        {can('users.verify') && (
          <StatCard
            icon={ShieldCheck}
            label="Pending Reviews"
            value={s.pendingVerifications}
            hint="Verifications awaiting action"
            tone={s.pendingVerifications > 0 ? 'brand' : 'ink'}
          />
        )}
        {can('disputes.view') && (
          <StatCard
            icon={Flag}
            label="Open Disputes"
            value={s.pendingReports}
            hint="Reports awaiting resolution"
            tone={s.pendingReports > 0 ? 'brand' : 'ink'}
          />
        )}
        {isSuperAdmin && (
          <StatCard
            icon={UserCheck}
            label="Admins"
            value={s.totalAdmins}
            hint={`${s.totalCategories} categories · ${s.totalSkills} skills`}
          />
        )}
        {can('transactions.view') && (
          <StatCard
            icon={TrendingUp}
            label="Total Proposals"
            value={s.totalProposals.toLocaleString()}
            hint="All time"
            tone="brand"
          />
        )}
      </div>

      {/* Quick actions */}
      {quickActions.length > 0 && (
        <QuickActions
          className={cn(
            quickActions.length <= 2 ? 'sm:grid-cols-2' :
            quickActions.length <= 4 ? 'sm:grid-cols-2 xl:grid-cols-4' :
            'sm:grid-cols-2 xl:grid-cols-3',
          )}
          items={quickActions}
        />
      )}

      {/* System status strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Activity,      label: 'API',        status: 'Operational', tone: 'success' },
          { icon: CheckCircle2,  label: 'Database',   status: 'Healthy',     tone: 'success' },
          { icon: CreditCard,    label: 'Payments',   status: 'Active',      tone: 'success' },
          { icon: Milestone,     label: 'Queue',      status: 'Running',     tone: 'success' },
        ].map(({ icon: Icon, label, status, tone }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-card"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-50">
              <Icon className="h-4 w-4 text-success-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-900">{label}</p>
              <p className="text-[11px] text-success-600">{status}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent data tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent users */}
        {can('users.view') && (
          <Card>
            <CardHeader
              title="Recent Users"
              description="Latest signups on the platform."
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
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
                          {(u.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/admin/users/${u.id}`}
                            className="block truncate text-sm font-semibold text-ink-900 hover:text-brand-600"
                          >
                            {u.name}
                          </Link>
                          <p className="truncate text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge tone={statusTone[u.role] ?? 'neutral'} size="xs">
                          {u.role}
                        </Badge>
                        <Badge tone={statusTone[u.status] ?? 'neutral'} size="xs" dot>
                          {u.status}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-8 text-center text-sm text-gray-400">No recent users.</p>
              )}
            </CardBody>
          </Card>
        )}

        {/* Recent jobs */}
        {can('jobs.view') && (
          <Card>
            <CardHeader
              title="Recent Jobs"
              description="Latest job postings on the platform."
              action={
                <Link to="/admin/jobs" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <CardBody className="p-0">
              {recentJobs.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {recentJobs.map((job) => (
                    <li key={job.id} className="flex items-center justify-between gap-4 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-900">{job.title}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {formatETB(job.min_budget ?? job.budget)} · {job.currency ?? 'ETB'}
                        </p>
                      </div>
                      <Badge tone={statusTone[job.status] ?? 'neutral'} size="xs" dot>
                        {job.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-8 text-center text-sm text-gray-400">No recent jobs.</p>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
