import { useCallback, useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote, Briefcase, Building2, ClipboardList, MapPin, Pencil,
  PlusCircle, Send, Star, Users, RefreshCw, DollarSign, TrendingUp,
  ArrowUpRight, ArrowDownRight, Handshake, Clock, CheckCircle2,
  XCircle, AlertTriangle, FileText, MessageSquare, Bell, Target,
  Globe, Zap, ChevronRight, Calendar, Timer, Wallet, Eye, EyeOff,
  BarChart3, PieChart, Download, Upload, Search, Filter, MoreVertical,
  Shield, Award, Bookmark, Heart, Flag, Milestone, CreditCard,
  TrendingDown, Minus, Layers, Box, Monitor, Cpu, HardDrive,
  UserCog, Settings, ScrollText, FolderTree, Wrench, ExternalLink,
  Trash2, Edit, Ban, Check, X, Archive, Sparkles, Rocket,
  Phone, Video, Mic, Image, File,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Avatar from '../../components/marketplace/Avatar';
import RatingDisplay from '../../components/marketplace/RatingDisplay';
import StatusBadge from '../../components/marketplace/StatusBadge';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { employerService } from '../../services/employerService';
import { contractService } from '../../services/contractService';
import { financialService } from '../../services/financialService';
import { recommendationService } from '../../services/recommendationService';
import { normalizeEmployer } from '../../utils/employerMapper';
import { normalizeJob } from '../../utils/jobMapper';
import { getErrorMessage } from '../../utils/errors';
import { formatETB, formatDate, timeAgo, getPlatformCurrency } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../utils/cn';
import { getEcho } from '../../config/echo';

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER: Format large numbers
   ═══════════════════════════════════════════════════════════════════════════ */
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return `${getPlatformCurrency()} 0`;
  return `${getPlatformCurrency()} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      const eased = 1 - Math.pow(1 - progress, 3);
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
   COMPONENT: Performance Metric Card
   ═══════════════════════════════════════════════════════════════════════════ */
function PerformanceMetric({ icon: Icon, label, value, maxValue = 100, color = 'brand', suffix = '' }) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const colors = {
    brand: { bg: 'bg-indigo-500', light: 'bg-indigo-100', text: 'text-indigo-600' },
    success: { bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-600' },
    warning: { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-600' },
    danger: { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-600' },
    info: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600' },
  };
  const c = colors[color] || colors.brand;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', c.light)}>
          <Icon className={cn('h-4 w-4', c.text)} />
        </div>
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-ink-900">{value}{suffix}</span>
        {maxValue < 100 && <span className="text-xs text-gray-400 mb-1">/ {maxValue}</span>}
      </div>
      <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-1000', c.bg)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: Earnings Card
   ═══════════════════════════════════════════════════════════════════════════ */
function EarningsCard({ icon: Icon, label, value, color = 'brand', trend, trendValue }) {
  const colors = {
    brand: { bg: 'bg-gradient-to-br from-indigo-500 to-violet-500', shadow: 'shadow-indigo-500/25' },
    success: { bg: 'bg-gradient-to-br from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/25' },
    warning: { bg: 'bg-gradient-to-br from-amber-500 to-orange-500', shadow: 'shadow-amber-500/25' },
    danger: { bg: 'bg-gradient-to-br from-red-500 to-pink-500', shadow: 'shadow-red-500/25' },
    info: { bg: 'bg-gradient-to-br from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/25' },
  };
  const c = colors[color] || colors.brand;

  return (
    <div className={cn('rounded-xl p-4 text-white shadow-lg', c.bg, c.shadow)}>
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
            trend === 'up' ? 'bg-emerald-500/20 text-emerald-100' :
            trend === 'down' ? 'bg-red-500/20 text-red-100' :
            'bg-white/20 text-white/80'
          )}>
            {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> :
             trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> :
             <Minus className="h-3 w-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-white/70">{label}</p>
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
   COMPONENT: Hiring Pipeline Card
   ═══════════════════════════════════════════════════════════════════════════ */
function HiringPipelineCard({ stage, count, icon: Icon, color, linkTo }) {
  const colors = {
    brand: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-200' },
    success: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200' },
    warning: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-200' },
    danger: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-200' },
    info: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' },
  };
  const c = colors[color] || colors.brand;

  return (
    <Link
      to={linkTo}
      className={cn(
        'flex items-center gap-3 rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg',
        c.border, c.bg
      )}
    >
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-white/80', c.icon)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-ink-900">{count}</p>
        <p className="text-xs font-medium text-gray-600">{stage}</p>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN: Employer Dashboard
   ═══════════════════════════════════════════════════════════════════════════ */
export default function EmployerDashboardPage() {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [finance, setFinance] = useState(null);
  const [activeContracts, setActiveContracts] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [pendingProposals, setPendingProposals] = useState([]);

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    setError(null);
    try {
      const [profileRes, jobsRes, financeRes, contractsRes] = await Promise.allSettled([
        employerService.getMyProfile(),
        employerService.getMyJobs({ page: 1 }),
        financialService.getEmployerFinance(),
        contractService.getContracts({ status: 'active', per_page: 5 }),
      ]);

      const profile = profileRes.status === 'fulfilled'
        ? normalizeEmployer(profileRes.value.data)
        : null;

      const rawJobs = jobsRes.status === 'fulfilled'
        ? (Array.isArray(jobsRes.value.data) ? jobsRes.value.data : (jobsRes.value.data?.data ?? []))
        : [];
      const jobs = rawJobs.map(normalizeJob);
      const jobsTotal = jobsRes.status === 'fulfilled'
        ? (jobsRes.value.meta?.total ?? jobsRes.value.data?.meta?.total ?? jobs.length)
        : jobs.length;

      const financeData = financeRes.status === 'fulfilled' ? (financeRes.value?.data ?? financeRes.value) : null;
      const contractsData = contractsRes.status === 'fulfilled'
        ? (Array.isArray(contractsRes.value.data) ? contractsRes.value.data : (contractsRes.value.data?.data ?? []))
        : [];

      setData({
        profile,
        jobs,
        jobsTotal,
      });

      setFinance(financeData);
      setActiveContracts(contractsData);
      setRecentJobs(jobs.slice(0, 5));
      setPendingProposals(jobs.reduce((sum, job) => sum + (job.proposalsCount ?? 0), 0));
      setLastUpdated(new Date());

      // Load recommendations
      recommendationService
        .getRecommendedFreelancers({ per_page: 5 })
        .then((res) => { if (res.success) setRecommendations(res.data ?? []); })
        .catch(() => {});
    } catch (err) {
      if (!silent) setError(getErrorMessage(err, 'Unable to load your dashboard. Please try again.'));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => loadDashboard(true), 60000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  // Refresh when user returns to this tab (e.g. after funding a milestone on another page)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadDashboard(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loadDashboard]);

  // Real-time WebSocket listener for financial events
  useEffect(() => {
    const echoInstance = getEcho();
    if (!echoInstance) return;

    const channel = echoInstance.private(`employer.${user?.id}`);

    channel.listen('.finance.milestone_funded', (event) => {
      showToast('💰 Milestone funded successfully!', 'success');
      loadDashboard(true);
    });

    channel.listen('.finance.milestone_released', (event) => {
      showToast('✅ Funds released to freelancer!', 'success');
      loadDashboard(true);
    });

    channel.listen('.finance.payment_completed', (event) => {
      showToast('✅ Payment completed!', 'success');
      loadDashboard(true);
    });

    channel.listen('.finance.withdrawal_completed', (event) => {
      loadDashboard(true);
    });

    channel.listen('.contract.updated', (event) => {
      loadDashboard(true);
    });

    channel.listen('.proposal.received', (event) => {
      showToast('📩 New proposal received!', 'info');
      loadDashboard(true);
    });

    return () => {
      channel.stopListening('.finance.milestone_funded');
      channel.stopListening('.finance.milestone_released');
      channel.stopListening('.finance.payment_completed');
      channel.stopListening('.finance.withdrawal_completed');
      channel.stopListening('.contract.updated');
      channel.stopListening('.proposal.received');
    };
  }, [user?.id, loadDashboard, showToast]);

  if (loading) return <Skeleton />;
  if (error || !data) {
    return (
      <ErrorState title="Unable to load your dashboard" description={error} onRetry={loadDashboard} />
    );
  }

  const { profile, jobs, jobsTotal } = data;
  const displayName = profile?.companyName || user?.name || profile?.name || 'there';
  const firstName = displayName.split(' ')[0];

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  /* ── Calculate Stats ──────────────────────────────────────────────────── */
  const s = {
    totalSpent: finance?.total_spent ?? 0,
    accountBalance: finance?.account_balance ?? 0,
    pendingPayments: finance?.pending_payments ?? 0,
    totalFees: finance?.total_fees ?? 0,
    activeJobs: jobs.filter(j => j.status === 'open' || j.status === 'published').length,
    totalJobs: jobsTotal,
    activeContractsCount: activeContracts.length,
    completedContracts: jobs.filter(j => j.status === 'completed').length,
    totalProposalsReceived: pendingProposals,
    proposalsReceivedThisWeek: Math.floor(pendingProposals * 0.3),
  };

  /* ── Hiring Pipeline ──────────────────────────────────────────────────── */
  const pipeline = [
    { stage: 'Open Jobs', count: s.activeJobs, icon: Briefcase, color: 'brand', linkTo: '/employer/jobs' },
    { stage: 'Proposals', count: s.totalProposalsReceived, icon: Send, color: 'info', linkTo: '/employer/jobs' },
    { stage: 'Active Contracts', count: s.activeContractsCount, icon: Handshake, color: 'success', linkTo: '/employer/contracts' },
    { stage: 'Completed', count: s.completedContracts, icon: CheckCircle2, color: 'warning', linkTo: '/employer/contracts' },
  ];

  /* ── Build Activity Feed ────────────────────────────────────────────── */
  const activityItems = [
    ...(s.totalProposalsReceived > 0 ? [{
      icon: Send, color: 'info',
      title: `${s.totalProposalsReceived} Proposal${s.totalProposalsReceived !== 1 ? 's' : ''} Received`,
      description: 'Freelancers are interested in your jobs',
      time: 'Active',
      link: '/employer/jobs',
    }] : []),
    ...(s.activeContractsCount > 0 ? [{
      icon: Handshake, color: 'success',
      title: `${s.activeContractsCount} Active Contract${s.activeContractsCount !== 1 ? 's' : ''}`,
      description: 'Work in progress with freelancers',
      time: 'Now',
      link: '/employer/contracts',
    }] : []),
    ...(s.totalSpent > 0 ? [{
      icon: DollarSign, color: 'brand',
      title: 'Spending Overview',
      description: `${formatCurrency(s.totalSpent)} total spent`,
      time: 'Finance',
      link: '/employer/settings/payment-methods',
    }] : []),
    ...(s.pendingPayments > 0 ? [{
      icon: Clock, color: 'warning',
      title: `${formatCurrency(s.pendingPayments)} in Escrow`,
      description: 'Funds held for active milestones',
      time: 'Pending',
      link: '/employer/contracts',
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
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-gray-200 bg-gray-100 shadow-lg flex items-center justify-center">
                {profile?.avatar
                  ? <img src={profile.avatar} alt={profile.companyName} className="h-full w-full object-cover" />
                  : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-gray-600">
                      {(profile?.companyName || firstName).charAt(0).toUpperCase()}
                    </div>
                  )
                }
              </div>
              <div>
                <p className="text-indigo-600 text-sm font-medium tracking-wider uppercase mb-1">{greeting} 👋</p>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">
                  {firstName}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  {profile?.companyName ? `${profile.companyName} · Employer` : 'Employer on DreamMore'}
                </p>
              </div>
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
              <Link
                to="/employer/jobs/create"
                className="flex items-center gap-2 rounded-full border border-indigo-300 bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-all shadow-sm"
              >
                <PlusCircle className="h-4 w-4" />
                Post a Job
              </Link>
            </div>
          </div>

          {/* Primary stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Account Balance */}
            <div className={cn(
              'rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 transition-all duration-500',
              isRefreshing && 'animate-pulse'
            )}>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                  <Wallet className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Budget</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {finance?.monthly_limit > 0 ? formatCurrency(s.accountBalance) : formatCurrency(s.totalSpent)}
              </p>
              <p className="text-xs text-emerald-600 mt-2">{finance?.monthly_limit > 0 ? `of ${formatCurrency(finance.monthly_limit)} limit` : 'Total spent'}</p>
            </div>

            {/* In Escrow */}
            <div className={cn(
              'rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-4 transition-all duration-500',
              isRefreshing && 'animate-pulse'
            )}>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">In Escrow</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {formatCurrency(s.pendingPayments)}
              </p>
              <p className="text-xs text-amber-600 mt-2">Awaiting release</p>
            </div>

            {/* Total Spent */}
            <div className={cn(
              'rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 transition-all duration-500',
              isRefreshing && 'animate-pulse'
            )}>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Total Spent</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {formatCurrency(s.totalSpent)}
              </p>
              <p className="text-xs text-blue-600 mt-2">All time spending</p>
            </div>

            {/* Active Jobs */}
            <div className={cn(
              'rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100 p-4 transition-all duration-500',
              isRefreshing && 'animate-pulse'
            )}>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500">
                  <Briefcase className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Active Jobs</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {s.activeJobs}
              </p>
              <p className="text-xs text-violet-600 mt-2">{s.totalJobs} total posted</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         HIRING PIPELINE — Track hiring stages
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {pipeline.map((item, i) => (
          <HiringPipelineCard key={i} {...item} />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         PERFORMANCE METRICS — Like Upwork
         ═══════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader
          title="Hiring Performance"
          description="Your employer metrics"
          action={
            <Link to="/employer/profile" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              View Profile <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <CardBody>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <PerformanceMetric
              icon={Briefcase}
              label="Jobs Posted"
              value={s.totalJobs}
              maxValue={Math.max(s.totalJobs, 10)}
              color="brand"
            />
            <PerformanceMetric
              icon={Send}
              label="Proposals Received"
              value={s.totalProposalsReceived}
              maxValue={Math.max(s.totalProposalsReceived, 20)}
              color="info"
            />
            <PerformanceMetric
              icon={Handshake}
              label="Active Contracts"
              value={s.activeContractsCount}
              maxValue={Math.max(s.activeContractsCount, 5)}
              color="success"
            />
            <PerformanceMetric
              icon={CheckCircle2}
              label="Completed Projects"
              value={s.completedContracts}
              maxValue={Math.max(s.completedContracts, 10)}
              color="warning"
            />
          </div>
        </CardBody>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════
         QUICK ACTIONS — Like Upwork/Fiverr
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <QuickAction icon={PlusCircle} label="Post Job" description="Hire top talent" to="/employer/jobs/create" color="brand" />
        <QuickAction icon={ClipboardList} label="My Jobs" description={`${s.totalJobs} posted`} to="/employer/jobs" color="violet" />
        <QuickAction icon={Handshake} label="Contracts" description={`${s.activeContractsCount} active`} to="/employer/contracts" color="emerald" />
        <QuickAction icon={DollarSign} label="Finance" description="Spending & payments" to="/employer/settings/payment-methods" color="amber" />
        <QuickAction icon={MessageSquare} label="Messages" description="Chat with talent" to="/employer/messages" color="info" />
        <QuickAction icon={Pencil} label="Edit Profile" description="Update company" to="/employer/profile/edit" color="brand" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         MAIN 3-COLUMN BENTO — Jobs + Freelancers + Activity
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Posted Jobs — 2 columns */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink-900">Your Posted Jobs</h2>
              <p className="text-xs text-gray-500 mt-0.5">Manage your job listings</p>
            </div>
            <Link to="/employer/jobs" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              View all →
            </Link>
          </div>
          {recentJobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Job</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Proposals</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Budget</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          to={`/employer/jobs/${job.id}`}
                          className="text-sm font-semibold text-ink-900 hover:text-indigo-600 line-clamp-1"
                        >
                          {job.title}
                        </Link>
                        {job.category && (
                          <p className="text-xs text-gray-400 mt-0.5">{job.category}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                          <Send className="h-3 w-3" />
                          {job.proposalsCount ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-ink-900">
                        {formatETB(job.budget)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={job.status} size="xs" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No jobs posted yet"
              description="Post your first job to start receiving proposals from top freelancers."
              className="py-8"
              action={
                <Link
                  to="/employer/jobs/create"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-600"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Post a Job
                </Link>
              }
            />
          )}
        </div>

        {/* Activity Feed */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-ink-900 mb-4">Activity Feed</h2>
          {activityItems.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {activityItems.slice(0, 5).map((item, i) => (
                <ActivityFeedItem key={i} {...item} />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No recent activity.</p>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         RECOMMENDED FREELANCERS — AI-powered matches
         ═══════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader
          title="Top Freelancers"
          description="AI-powered talent recommendations"
          action={
            <Link to="/freelancers" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Browse All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <CardBody className="p-0">
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-5">
              {recommendations.slice(0, 5).map((rec) => {
                const fl = rec.freelancer ?? rec;
                return (
                  <Link
                    key={fl.id}
                    to={`/freelancers/${fl.id}`}
                    className="group flex flex-col items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200"
                  >
                    <div className="relative">
                      <Avatar name={fl.name} src={fl.avatar} size="lg" />
                      {fl.rating > 0 && (
                        <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                          <Star className="h-2.5 w-2.5" />
                          {fl.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-ink-900 group-hover:text-indigo-600 line-clamp-1">{fl.name}</p>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{fl.headline || fl.category}</p>
                    </div>
                    {fl.hourlyRate && (
                      <span className="text-xs font-medium text-emerald-600">{formatETB(fl.hourlyRate)}/hr</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No recommendations yet"
              description="Post a job to get freelancer matches tailored to your needs."
              className="py-8"
            />
          )}
        </CardBody>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════
         ACTIVE CONTRACTS TABLE
         ═══════════════════════════════════════════════════════════════════ */}
      {activeContracts.length > 0 && (
        <Card>
          <CardHeader
            title="Active Contracts"
            description="Work in progress with freelancers"
            action={
              <Link to="/employer/contracts" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Contract</th>
                    <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Freelancer</th>
                    <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                    <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeContracts.slice(0, 5).map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-sm font-semibold text-ink-900 line-clamp-1">{contract.title || `Contract #${contract.id}`}</p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                            {(contract.freelancer?.name || 'F').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-600">{contract.freelancer?.name || 'Freelancer'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-ink-900">
                        {formatETB(contract.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={contract.status} size="xs" />
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          to={`/employer/contracts/${contract.id}`}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         COMPANY PROFILE STRIP
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-extrabold text-indigo-600">
              {(profile?.companyName || user?.name || 'E').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-ink-900">
                {profile?.companyName || user?.name || 'Company'}
              </p>
              <p className="text-sm text-gray-500 line-clamp-1">
                {profile?.companyDescription || 'No company description set'}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                {profile?.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />{profile.location}
                  </span>
                )}
                {profile?.industry && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />{profile.industry}
                  </span>
                )}
                {profile?.rating > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-400" />
                    {profile.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button as={Link} to="/employer/profile" variant="outline" size="sm">
              View Profile
            </Button>
            <Button as={Link} to="/employer/profile/edit" size="sm">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>
        </div>
      </div>

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

// ── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-48 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-200" />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-gray-200" />)}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-64 rounded-2xl bg-gray-200" />
        <div className="h-64 rounded-2xl bg-gray-200" />
      </div>
      <div className="h-48 rounded-2xl bg-gray-200" />
    </div>
  );
}

// ── Quick action card ─────────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, description, to, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-500 hover:bg-brand-600',
    emerald: 'bg-emerald-500 hover:bg-emerald-600',
    violet: 'bg-violet-500 hover:bg-violet-600',
    amber: 'bg-amber-500 hover:bg-amber-600',
    info: 'bg-blue-500 hover:bg-blue-600',
  };
  return (
    <Link
      to={to}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl text-white transition-transform group-hover:scale-110', colors[color] ?? colors.brand)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-bold text-ink-900">{label}</p>
        <p className="mt-0.5 text-xs text-gray-400">{description}</p>
      </div>
    </Link>
  );
}
