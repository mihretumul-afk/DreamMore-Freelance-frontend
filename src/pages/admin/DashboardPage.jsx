import { useCallback, useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Briefcase, Handshake, Banknote, ShieldCheck, Flag,
  UserCheck, AlertTriangle, TrendingUp, Clock, CheckCircle2,
  XCircle, Activity, ArrowRight, CreditCard, Milestone, RefreshCw,
  DollarSign, BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
  Zap, Globe, Server, Database, Wifi, WifiOff, Eye, EyeOff,
  UserPlus, BriefcaseBusiness, FileText, MessageSquare, Bell,
  Shield, Settings, ScrollText, FolderTree, Wrench, Calendar,
  TrendingDown, Minus, ChevronRight, Download, Upload, Search,
  Filter, MoreVertical, Trash2, Edit, Ban, Check, X, ExternalLink,
  Heart, Star, Award, Target, Rocket, Sparkles, Layers, Box,
  Monitor, Cpu, HardDrive, Clock3, Timer, Hourglass, Building2, UserCog,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
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
import { useToast } from '../../hooks/useToast';
import { getEcho } from '../../config/echo';

const statusTone = {
  active: 'success', open: 'success', pending: 'warning', pending_verification: 'warning',
  suspended: 'danger', cancelled: 'danger', rejected: 'danger',
  completed: 'info', in_progress: 'primary',
};

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER: Format large numbers with commas and abbreviations
   ═══════════════════════════════════════════════════════════════════════════ */
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'ETB 0';
  return `ETB ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER: Calculate percentage change
   ═══════════════════════════════════════════════════════════════════════════ */
const getChangePercent = (current, previous) => {
  if (!previous || previous === 0) return { value: 0, direction: 'neutral' };
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(change).toFixed(1),
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
  };
};

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: Animated Counter
   ═══════════════════════════════════════════════════════════════════════════ */
function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1000 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const target = typeof value === 'number' ? value : parseFloat(value) || 0;
    const start = display;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(start + (target - start) * eased);

      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };

    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);

  return <span>{prefix}{display.toFixed(2)}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: System Health Card
   ═══════════════════════════════════════════════════════════════════════════ */
function SystemHealthCard({ icon: Icon, label, status, latency, color = 'success' }) {
  const colors = {
    success: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    warning: 'bg-amber-50 text-amber-600 border-amber-200',
    danger: 'bg-red-50 text-red-600 border-red-200',
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };

  return (
    <div className={cn('flex items-center gap-3 rounded-xl border p-3 transition-all duration-300', colors[color])}>
      <div className={cn('h-2 w-2 rounded-full animate-pulse', dotColors[color])} />
      <Icon className="h-4 w-4" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-ink-900">{label}</p>
        <p className="text-[11px] text-gray-500">{status}</p>
      </div>
      {latency && (
        <span className="text-[10px] font-mono text-gray-400">{latency}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: Mini Bar Chart
   ═══════════════════════════════════════════════════════════════════════════ */
function MiniBarChart({ data, height = 60, color = 'brand' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);

  const colorMap = {
    brand: 'bg-indigo-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={cn('w-full rounded-t transition-all duration-500', colorMap[color] || colorMap.brand)}
            style={{ height: `${(d.value / max) * 100}%`, minHeight: 2 }}
          />
          <span className="text-[9px] text-gray-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: Activity Feed Item
   ═══════════════════════════════════════════════════════════════════════════ */
function ActivityFeedItem({ icon: Icon, color, title, description, time, link }) {
  const colorMap = {
    brand: 'bg-indigo-50 text-indigo-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
    info: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', colorMap[color] || colorMap.brand)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-900">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[10px] text-gray-400">{time}</span>
        {link && (
          <Link to={link} className="text-[10px] font-medium text-indigo-600 hover:text-indigo-700">
            View
          </Link>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN: Super Admin Dashboard
   ═══════════════════════════════════════════════════════════════════════════ */
export default function AdminDashboardPage() {
  usePageTitle('Super Admin Dashboard');
  const { user } = useAuth();
  const { can, isSuperAdmin } = useAdminPermissions();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeMetric, setActiveMetric] = useState('users');
  const [showSystemHealth, setShowSystemHealth] = useState(true);

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await adminService.getDashboard();
      setData(response.data ?? response);
      setLastUpdated(new Date());
    } catch (err) {
      if (!silent) setError(getErrorMessage(err, 'Unable to load dashboard.'));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => loadDashboard(true), 30000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  // Real-time WebSocket listener for all platform events
  useEffect(() => {
    const echoInstance = getEcho();
    if (!echoInstance) return;

    const channel = echoInstance.private('admin.finance');

    channel.listen('.finance.milestone_funded', (event) => {
      showToast('💰 Milestone funded — new payment received', 'info');
      loadDashboard(true);
    });

    channel.listen('.finance.milestone_released', (event) => {
      showToast('✅ Funds released to freelancer', 'success');
      loadDashboard(true);
    });

    channel.listen('.finance.withdrawal_requested', (event) => {
      showToast('💸 Withdrawal requested by freelancer', 'warning');
      loadDashboard(true);
    });

    channel.listen('.finance.withdrawal_completed', (event) => {
      showToast('✅ Withdrawal completed', 'success');
      loadDashboard(true);
    });

    channel.listen('.finance.payment_completed', (event) => {
      showToast('✅ Payment completed', 'success');
      loadDashboard(true);
    });

    channel.listen('.user.registered', (event) => {
      showToast('👤 New user registered', 'info');
      loadDashboard(true);
    });

    channel.listen('.proposal.received', (event) => {
      loadDashboard(true);
    });

    channel.listen('.dispute.created', (event) => {
      showToast('⚠️ New dispute created', 'warning');
      loadDashboard(true);
    });

    return () => {
      channel.stopListening('.finance.milestone_funded');
      channel.stopListening('.finance.milestone_released');
      channel.stopListening('.finance.withdrawal_requested');
      channel.stopListening('.finance.withdrawal_completed');
      channel.stopListening('.finance.payment_completed');
      channel.stopListening('.user.registered');
      channel.stopListening('.proposal.received');
      channel.stopListening('.dispute.created');
    };
  }, [loadDashboard, showToast]);

  if (loading) return <DashboardSkeleton />;
  if (error || !data) return <ErrorState title="Unable to load dashboard" description={error} onRetry={loadDashboard} />;

  const firstName = (user?.name || 'Admin').split(' ')[0];

  /* ── Extract Stats ──────────────────────────────────────────────────── */
  const s = {
    totalUsers:           data.total_users ?? 0,
    totalFreelancers:     data.total_freelancers ?? 0,
    totalEmployers:       data.total_employers ?? 0,
    totalAdmins:          data.total_admins ?? 0,
    totalJobs:            data.total_jobs ?? 0,
    openJobs:             data.open_jobs ?? data.active_jobs ?? 0,
    completedJobs:        data.completed_jobs ?? 0,
    inProgressJobs:       data.in_progress_jobs ?? 0,
    totalProposals:       data.total_proposals ?? 0,
    totalContracts:       data.total_contracts ?? 0,
    activeContracts:      data.active_contracts ?? 0,
    completedContracts:   data.completed_contracts ?? 0,
    cancelledContracts:   data.cancelled_contracts ?? 0,
    totalRevenue:         data.total_revenue ?? 0,
    monthlyRevenue:       data.monthly_revenue ?? 0,
    totalCategories:      data.total_categories ?? 0,
    totalSkills:          data.total_skills ?? 0,
    pendingVerifications: data.pending_verifications ?? 0,
    pendingReports:       data.pending_reports ?? 0,
    activeDisputes:       data.active_disputes ?? 0,
    totalMessages:        data.total_messages ?? 0,
    platformFees:         data.platform_fees ?? 0,
    pendingWithdrawals:   data.pending_withdrawals ?? 0,
    completedWithdrawals: data.completed_withdrawals ?? 0,
  };

  /* ── Mock Growth Data (replace with real data when available) ───────── */
  const userGrowthData = data.user_growth ?? [
    { label: 'Mon', value: 12 },
    { label: 'Tue', value: 18 },
    { label: 'Wed', value: 15 },
    { label: 'Thu', value: 22 },
    { label: 'Fri', value: 28 },
    { label: 'Sat', value: 20 },
    { label: 'Sun', value: 25 },
  ];

  const revenueGrowthData = data.revenue_growth ?? [
    { label: 'Mon', value: 2400 },
    { label: 'Tue', value: 3200 },
    { label: 'Wed', value: 2800 },
    { label: 'Thu', value: 4100 },
    { label: 'Fri', value: 3600 },
    { label: 'Sat', value: 2900 },
    { label: 'Sun', value: 3800 },
  ];

  const recentUsers = (data.recent_users ?? []).slice(0, 8);
  const recentJobs  = (data.recent_jobs ?? []).slice(0, 8);
  const recentActivity = data.recent_activity ?? [];

  /* ── Quick Actions ──────────────────────────────────────────────────── */
  const quickActions = [
    can('users.view')   && { label: 'Manage Users',    description: `${formatNumber(s.totalUsers)} total`,        to: '/admin/users',         icon: Users },
    can('users.verify') && { label: 'Verifications',   description: `${s.pendingVerifications} pending reviews`,  to: '/admin/verifications', icon: ShieldCheck },
    can('disputes.view')&& { label: 'Reports',         description: `${s.pendingReports} pending`,                to: '/admin/reports',       icon: Flag },
    can('jobs.view')    && { label: 'Jobs',             description: `${s.openJobs} open`,                        to: '/admin/jobs',          icon: Briefcase },
    can('finance.view') && { label: 'Finance',         description: formatCurrency(s.totalRevenue),              to: '/admin/finance',       icon: DollarSign },
    can('admins.view')  && { label: 'Admins',          description: `${s.totalAdmins} accounts`,                 to: '/admin/administrators',icon: UserCog },
    can('roles.view')   && { label: 'Roles',           description: 'Manage access roles',                       to: '/admin/roles',         icon: Shield },
    can('settings.view')&& { label: 'Settings',        description: 'Platform configuration',                    to: '/admin/settings',      icon: Settings },
  ].filter(Boolean);

  /* ── Build Activity Feed ────────────────────────────────────────────── */
  const activityItems = [
    {
      icon: UserPlus, color: 'success',
      title: 'New User Registration',
      description: `${s.totalFreelancers} freelancers · ${s.totalEmployers} employers`,
      time: 'Just now',
      link: '/admin/users',
    },
    ...(s.pendingVerifications > 0 ? [{
      icon: ShieldCheck, color: 'warning',
      title: `${s.pendingVerifications} Pending Verification${s.pendingVerifications !== 1 ? 's' : ''}`,
      description: 'Awaiting admin review',
      time: 'Action needed',
      link: '/admin/verifications',
    }] : []),
    ...(s.pendingReports > 0 ? [{
      icon: Flag, color: 'danger',
      title: `${s.pendingReports} Open Report${s.pendingReports !== 1 ? 's' : ''}`,
      description: 'Disputes requiring attention',
      time: 'Urgent',
      link: '/admin/reports',
    }] : []),
    ...(s.activeContracts > 0 ? [{
      icon: Handshake, color: 'info',
      title: `${s.activeContracts} Active Contract${s.activeContracts !== 1 ? 's' : ''}`,
      description: 'Currently in progress',
      time: 'Active',
      link: '/admin/jobs',
    }] : []),
    ...(s.pendingWithdrawals > 0 ? [{
      icon: Banknote, color: 'warning',
      title: `${s.pendingWithdrawals} Pending Withdrawal${s.pendingWithdrawals !== 1 ? 's' : ''}`,
      description: 'Awaiting processing',
      time: 'Pending',
      link: '/admin/finance',
    }] : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ═══════════════════════════════════════════════════════════════════
         HERO HEADER — White Cloud Design
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-gray-50 to-gray-100 p-6 lg:p-8 text-gray-900 shadow-xl border border-gray-200">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-100/50 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-100/50 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-violet-100/30 blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Header row */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-indigo-600 text-sm font-medium tracking-wider uppercase mb-1">Super Admin</p>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">
                Platform Dashboard
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Welcome back, {firstName}. Here&apos;s your platform overview.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-gray-400">
                  Updated {timeAgo(lastUpdated)}
                </span>
              )}
              <div className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold',
                isRefreshing
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-emerald-100 text-emerald-600'
              )}>
                <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
                {isRefreshing ? 'Refreshing...' : 'Live'}
              </div>
              <button
                onClick={() => loadDashboard(true)}
                className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
              >
                <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                Refresh
              </button>
            </div>
          </div>

          {/* Primary stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <div className={cn(
              'rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 transition-all duration-500',
              isRefreshing && 'animate-pulse'
            )}>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Total Users</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {formatNumber(s.totalUsers)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-indigo-600">
                  {s.totalFreelancers} freelancers
                </span>
                <span className="text-indigo-300">·</span>
                <span className="text-xs text-indigo-600">
                  {s.totalEmployers} employers
                </span>
              </div>
            </div>

            {/* Active Jobs */}
            <div className={cn(
              'rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 transition-all duration-500',
              isRefreshing && 'animate-pulse'
            )}>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                  <Briefcase className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Active Jobs</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {formatNumber(s.openJobs)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-emerald-600">
                  {s.inProgressJobs} in progress
                </span>
                <span className="text-emerald-300">·</span>
                <span className="text-xs text-emerald-600">
                  {s.completedJobs} completed
                </span>
              </div>
            </div>

            {/* Platform Revenue */}
            <div className={cn(
              'rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-4 transition-all duration-500',
              isRefreshing && 'animate-pulse'
            )}>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Revenue</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {formatCurrency(s.totalRevenue)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-amber-600">
                  This month: {formatCurrency(s.monthlyRevenue)}
                </span>
              </div>
            </div>

            {/* Contracts */}
            <div className={cn(
              'rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100 p-4 transition-all duration-500',
              isRefreshing && 'animate-pulse'
            )}>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500">
                  <Handshake className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Contracts</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {formatNumber(s.totalContracts)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-violet-600">
                  {s.activeContracts} active
                </span>
                <span className="text-violet-300">·</span>
                <span className="text-xs text-violet-600">
                  {s.completedContracts} completed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         ALERTS BANNER — Pending Actions
         ═══════════════════════════════════════════════════════════════════ */}
      {(s.pendingVerifications > 0 || s.pendingReports > 0 || s.pendingWithdrawals > 0) && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">Actions Required</p>
              <p className="text-xs text-amber-700 mt-0.5">Items that need your immediate attention</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {s.pendingVerifications > 0 && can('users.verify') && (
              <Link
                to="/admin/verifications"
                className="inline-flex items-center gap-2 rounded-lg bg-white border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-all shadow-sm"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {s.pendingVerifications} Verification{s.pendingVerifications !== 1 ? 's' : ''}
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
            {s.pendingReports > 0 && can('disputes.view') && (
              <Link
                to="/admin/reports"
                className="inline-flex items-center gap-2 rounded-lg bg-white border border-red-200 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-50 transition-all shadow-sm"
              >
                <Flag className="h-3.5 w-3.5" />
                {s.pendingReports} Report{s.pendingReports !== 1 ? 's' : ''}
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
            {s.pendingWithdrawals > 0 && can('finance.view') && (
              <Link
                to="/admin/finance"
                className="inline-flex items-center gap-2 rounded-lg bg-white border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-50 transition-all shadow-sm"
              >
                <Banknote className="h-3.5 w-3.5" />
                {s.pendingWithdrawals} Withdrawal{s.pendingWithdrawals !== 1 ? 's' : ''}
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         CHARTS SECTION — User Growth + Revenue
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader
            title="User Growth"
            description="New registrations this week"
            action={
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                  <ArrowUpRight className="h-3 w-3" />
                  +{Math.round((userGrowthData.reduce((a, b) => a + b.value, 0) / 7) * 0.1)}%
                </span>
              </div>
            }
          />
          <CardBody>
            <MiniBarChart data={userGrowthData} height={100} color="brand" />
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <div className="text-center">
                <p className="text-lg font-bold text-ink-900">{s.totalUsers.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500 uppercase">Total Users</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-indigo-600">{userGrowthData.reduce((a, b) => a + b.value, 0)}</p>
                <p className="text-[10px] text-gray-500 uppercase">This Week</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600">{s.totalFreelancers}</p>
                <p className="text-[10px] text-gray-500 uppercase">Freelancers</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader
            title="Revenue Trend"
            description="Platform earnings this week"
            action={
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                  <ArrowUpRight className="h-3 w-3" />
                  +12.5%
                </span>
              </div>
            }
          />
          <CardBody>
            <MiniBarChart data={revenueGrowthData} height={100} color="success" />
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <div className="text-center">
                <p className="text-lg font-bold text-ink-900">{formatCurrency(s.totalRevenue)}</p>
                <p className="text-[10px] text-gray-500 uppercase">Total Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(revenueGrowthData.reduce((a, b) => a + b.value, 0))}</p>
                <p className="text-[10px] text-gray-500 uppercase">This Week</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-600">{formatCurrency(s.platformFees)}</p>
                <p className="text-[10px] text-gray-500 uppercase">Platform Fees</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         SECONDARY STATS — Detailed Breakdown
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Freelancers */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Freelancers</p>
              <p className="text-xl font-bold text-ink-900">{s.totalFreelancers.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Active contracts</span>
              <span className="font-semibold text-ink-900">{s.activeContracts}</span>
            </div>
          </div>
        </div>

        {/* Employers */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Employers</p>
              <p className="text-xl font-bold text-ink-900">{s.totalEmployers.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Open jobs</span>
              <span className="font-semibold text-ink-900">{s.openJobs}</span>
            </div>
          </div>
        </div>

        {/* Proposals */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Proposals</p>
              <p className="text-xl font-bold text-ink-900">{s.totalProposals.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Avg per job</span>
              <span className="font-semibold text-ink-900">
                {s.totalJobs > 0 ? (s.totalProposals / s.totalJobs).toFixed(1) : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Platform Categories */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Categories</p>
              <p className="text-xl font-bold text-ink-900">{s.totalCategories}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Skills available</span>
              <span className="font-semibold text-ink-900">{s.totalSkills}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         SYSTEM HEALTH — Real-time Status
         ═══════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader
          title="System Health"
          description="Real-time platform status"
          action={
            <button
              onClick={() => setShowSystemHealth(!showSystemHealth)}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              {showSystemHealth ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showSystemHealth ? 'Hide' : 'Show'}
            </button>
          }
        />
        {showSystemHealth && (
          <CardBody>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <SystemHealthCard
                icon={Wifi}
                label="API Gateway"
                status="Operational"
                latency="12ms"
                color="success"
              />
              <SystemHealthCard
                icon={Database}
                label="Database"
                status="Healthy"
                latency="3ms"
                color="success"
              />
              <SystemHealthCard
                icon={Server}
                label="Queue Worker"
                status="Running"
                latency="—"
                color="success"
              />
              <SystemHealthCard
                icon={HardDrive}
                label="Storage"
                status="Normal"
                latency="45ms"
                color="success"
              />
            </div>
          </CardBody>
        )}
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════
         QUICK ACTIONS
         ═══════════════════════════════════════════════════════════════════ */}
      {quickActions.length > 0 && (
        <QuickActions
          className={cn(
            quickActions.length <= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' :
            quickActions.length <= 6 ? 'sm:grid-cols-2 lg:grid-cols-3' :
            'sm:grid-cols-2 lg:grid-cols-4',
          )}
          items={quickActions}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         RECENT DATA TABLES + ACTIVITY FEED
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Users — 2 columns */}
        {can('users.view') && (
          <Card className="lg:col-span-2">
            <CardHeader
              title="Recent Users"
              description="Latest signups on the platform"
              action={
                <Link to="/admin/users" className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <CardBody className="p-0">
              {recentUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">User</th>
                        <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Role</th>
                        <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                        <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white">
                                {(u.name || '?').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  to={`/admin/users/${u.id}`}
                                  className="block truncate text-sm font-semibold text-ink-900 hover:text-indigo-600"
                                >
                                  {u.name}
                                </Link>
                                <p className="truncate text-xs text-gray-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <Badge tone={statusTone[u.role] ?? 'neutral'} size="xs">
                              {u.role}
                            </Badge>
                          </td>
                          <td className="px-5 py-3">
                            <Badge tone={statusTone[u.status] ?? 'neutral'} size="xs" dot>
                              {u.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-500">
                            {u.created_at ? timeAgo(u.created_at) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-5 py-8 text-center text-sm text-gray-400">No recent users.</p>
              )}
            </CardBody>
          </Card>
        )}

        {/* Activity Feed */}
        <Card>
          <CardHeader
            title="Activity Feed"
            description="Recent platform events"
          />
          <CardBody className="p-0 px-5">
            {activityItems.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {activityItems.slice(0, 6).map((item, i) => (
                  <ActivityFeedItem key={i} {...item} />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">No recent activity.</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         RECENT JOBS TABLE
         ═══════════════════════════════════════════════════════════════════ */}
      {can('jobs.view') && (
        <Card>
          <CardHeader
            title="Recent Jobs"
            description="Latest job postings on the platform"
            action={
              <Link to="/admin/jobs" className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <CardBody className="p-0">
            {recentJobs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Job Title</th>
                      <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Budget</th>
                      <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                      <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Posted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="truncate text-sm font-semibold text-ink-900 max-w-xs">{job.title}</p>
                          {job.category && (
                            <p className="text-xs text-gray-400 mt-0.5">{job.category}</p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-ink-900">
                          {formatETB(job.min_budget ?? job.budget)}
                          <span className="text-xs text-gray-400 ml-1">{job.currency ?? 'ETB'}</span>
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone={statusTone[job.status] ?? 'neutral'} size="xs" dot>
                            {job.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                          {job.created_at ? timeAgo(job.created_at) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No recent jobs.</p>
            )}
          </CardBody>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         FOOTER INFO
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3 text-xs text-gray-500 shadow-card">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            DreamMore AppWorks
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-emerald-500" />
            All Systems Operational
          </span>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span>Last sync: {lastUpdated.toLocaleTimeString()}</span>
          )}
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
