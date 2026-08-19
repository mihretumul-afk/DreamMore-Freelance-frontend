import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  Handshake,
  Banknote,
  ShieldCheck,
  Flag,
  FolderTree,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import StatCard from '../../components/dashboard/StatCard';
import QuickActions from '../../components/dashboard/QuickActions';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/errors';
import { formatETB } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function AdminDashboardPage() {
  usePageTitle('Admin Dashboard');
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
      setError(getErrorMessage(err, 'Unable to load admin dashboard. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <ErrorState
        title="Unable to load admin dashboard"
        description={error}
        onRetry={loadDashboard}
      />
    );
  }

  const firstName = (user?.name || 'Admin').split(' ')[0];

  const stats = {
    totalUsers: data.total_users ?? data.totalUsers ?? 0,
    totalFreelancers: data.total_freelancers ?? data.totalFreelancers ?? 0,
    totalEmployers: data.total_employers ?? data.totalEmployers ?? 0,
    totalJobs: data.total_jobs ?? data.totalJobs ?? 0,
    activeJobs: data.active_jobs ?? data.activeJobs ?? 0,
    activeContracts: data.active_contracts ?? data.activeContracts ?? 0,
    totalRevenue: data.total_revenue ?? data.totalRevenue ?? 0,
    pendingVerifications: data.pending_verifications ?? data.pendingVerifications ?? 0,
    pendingReports: data.pending_reports ?? data.pendingReports ?? 0,
    totalCategories: data.total_categories ?? data.totalCategories ?? 0,
    totalSkills: data.total_skills ?? data.totalSkills ?? 0,
  };

  const recentUsers = (data.recent_users ?? data.recentUsers ?? []).slice(0, 5);
  const recentJobs = (data.recent_jobs ?? data.recentJobs ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-gray-500">
          Here&apos;s what&apos;s happening on the Dream More AppWorks platform today.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total users"
          value={stats.totalUsers}
          hint={`${stats.totalFreelancers} freelancers · ${stats.totalEmployers} employers`}
        />
        <StatCard
          icon={Briefcase}
          label="Total jobs"
          value={stats.totalJobs}
          hint={`${stats.activeJobs} active`}
          tone="brand"
        />
        <StatCard
          icon={Handshake}
          label="Active contracts"
          value={stats.activeContracts}
          hint="Currently in progress"
          tone="emerald"
        />
        <StatCard
          icon={Banknote}
          label="Total revenue"
          value={formatETB(stats.totalRevenue)}
          tone="emerald"
          hint="Platform-wide"
        />
      </div>

      {/* Quick actions */}
      <QuickActions
        className="xl:grid-cols-4"
        items={[
          {
            label: 'Manage Users',
            description: 'View and manage all users',
            to: '/admin/users',
            icon: Users,
          },
          {
            label: 'Verifications',
            description: `${stats.pendingVerifications} pending reviews`,
            to: '/admin/verifications',
            icon: ShieldCheck,
          },
          {
            label: 'Reports',
            description: `${stats.pendingReports} pending reports`,
            to: '/admin/reports',
            icon: Flag,
          },
          {
            label: 'Categories & Skills',
            description: 'Manage platform taxonomy',
            to: '/admin/categories',
            icon: FolderTree,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent users */}
        <Card>
          <CardHeader
            title="Recent users"
            description="Latest signups on the platform."
            action={
              <Link
                to="/admin/users"
                className="text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                View all
              </Link>
            }
          />
          <CardBody>
            {recentUsers.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {recentUsers.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <Link
                        to={`/admin/users/${u.id}`}
                        className="block truncate text-sm font-bold text-ink-900 transition-colors hover:text-brand-600"
                      >
                        {u.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-gray-500">{u.email}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide border-gray-200 bg-gray-100 text-gray-700">
                      {u.role}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-gray-500">No recent users.</p>
            )}
          </CardBody>
        </Card>

        {/* Recent jobs */}
        <Card>
          <CardHeader
            title="Recent jobs"
            description="Latest jobs posted on the platform."
            action={
              <Link
                to="/admin/jobs"
                className="text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                View all
              </Link>
            }
          />
          <CardBody>
            {recentJobs.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {recentJobs.map((job) => (
                  <li key={job.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink-900">{job.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {formatETB(job.budget)} · {job.status}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-gray-500">No recent jobs.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
