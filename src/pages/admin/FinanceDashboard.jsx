import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard, Banknote, TrendingUp, ArrowRight, Milestone,
  AlertTriangle, CheckCircle2, Clock, Wallet,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/dashboard/StatCard';
import QuickActions from '../../components/dashboard/QuickActions';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/errors';
import { formatETB, formatDate, timeAgo } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function FinanceDashboard() {
  usePageTitle('Finance Dashboard');
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

  const firstName = (user?.name || 'Finance Admin').split(' ')[0];

  const s = {
    totalRevenue: data.total_revenue ?? 0,
    activeContracts: data.active_contracts ?? 0,
    completedContracts: data.completed_contracts ?? 0,
    totalContracts: data.total_contracts ?? 0,
    totalJobs: data.total_jobs ?? 0,
    openJobs: data.open_jobs ?? 0,
    completedJobs: data.completed_jobs ?? 0,
    pendingReports: data.pending_reports ?? 0,
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
            Monitor payments, transactions, and financial health.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
          Finance Panel
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Banknote} label="Total Revenue" value={formatETB(s.totalRevenue)} hint="Platform-wide" tone="emerald" />
        <StatCard icon={Milestone} label="Active Contracts" value={s.activeContracts.toLocaleString()} hint={`${s.completedContracts} completed`} tone="brand" />
        <StatCard icon={CreditCard} label="Total Jobs" value={s.totalJobs.toLocaleString()} hint={`${s.openJobs} open · ${s.completedJobs} completed`} />
        <StatCard icon={TrendingUp} label="Contract Value" value={formatETB(s.totalRevenue)} hint="All time" tone="emerald" />
      </div>

      {/* Quick Actions */}
      <QuickActions items={[
        { label: 'Payments', description: 'View payment records', to: '/admin/payments', icon: CreditCard },
        { label: 'Transactions', description: 'Transaction history', to: '/admin/transactions', icon: ArrowRight },
        { label: 'Milestones', description: 'Milestone management', to: '/admin/milestones', icon: Milestone },
        { label: 'Reports', description: `${s.pendingReports} pending`, to: '/admin/reports', icon: AlertTriangle },
      ]} />

      {/* System Status */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: CreditCard, label: 'Payments', status: 'Active', tone: 'success' },
          { icon: Wallet, label: 'Escrow', status: 'Operational', tone: 'success' },
          { icon: TrendingUp, label: 'Revenue', status: 'Growing', tone: 'success' },
          { icon: CheckCircle2, label: 'Settlements', status: 'Running', tone: 'success' },
        ].map(({ icon: Icon, label, status, tone }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-card">
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
    </div>
  );
}
