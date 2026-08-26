import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Flag, AlertTriangle, CheckCircle2, Clock, ArrowRight,
  Shield, Users, Briefcase, XCircle,
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

export default function DisputeDashboard() {
  usePageTitle('Disputes Dashboard');
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

  const firstName = (user?.name || 'Dispute Admin').split(' ')[0];

  const s = {
    pendingReports: data.pending_reports ?? 0,
    totalUsers: data.total_users ?? 0,
    totalJobs: data.total_jobs ?? 0,
    activeContracts: data.active_contracts ?? 0,
    completedContracts: data.completed_contracts ?? 0,
    totalFreelancers: data.total_freelancers ?? 0,
    totalEmployers: data.total_employers ?? 0,
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
            Review and resolve disputes and reports.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
          Disputes Panel
        </div>
      </div>

      {/* Pending alerts */}
      {s.pendingReports > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-danger-600" aria-hidden="true" />
          <p className="text-sm font-medium text-danger-800">
            {s.pendingReports} dispute{s.pendingReports !== 1 ? 's' : ''} awaiting resolution
          </p>
          <Link to="/admin/reports" className="inline-flex items-center gap-1 rounded-full bg-danger-100 px-2.5 py-0.5 text-xs font-bold text-danger-800 hover:bg-danger-200">
            Review now <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Flag} label="Open Disputes" value={s.pendingReports} hint="Awaiting resolution" tone={s.pendingReports > 0 ? 'brand' : 'ink'} />
        <StatCard icon={Users} label="Total Users" value={s.totalUsers.toLocaleString()} hint={`${s.totalFreelancers} freelancers · ${s.totalEmployers} employers`} />
        <StatCard icon={Briefcase} label="Active Contracts" value={s.activeContracts.toLocaleString()} hint={`${s.completedContracts} completed`} tone="emerald" />
        <StatCard icon={Shield} label="Platform Health" value={s.totalJobs.toLocaleString()} hint="Total jobs posted" tone="brand" />
      </div>

      {/* Quick Actions */}
      <QuickActions items={[
        { label: 'Reports', description: `${s.pendingReports} pending disputes`, to: '/admin/reports', icon: Flag },
        { label: 'Users', description: `${s.totalUsers.toLocaleString()} total`, to: '/admin/users', icon: Users },
        { label: 'Jobs', description: 'View all jobs', to: '/admin/jobs', icon: Briefcase },
        { label: 'Audit Logs', description: 'Activity history', to: '/admin/audit-logs', icon: Clock },
      ]} />
    </div>
  );
}
