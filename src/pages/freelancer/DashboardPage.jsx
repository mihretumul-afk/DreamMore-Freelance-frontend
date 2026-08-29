import { useCallback, useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, Banknote, Briefcase, CheckCircle2, ClipboardList, Clock,
  DollarSign, FileText, FolderOpen, MapPin, Pencil, Send, Star,
  TrendingUp, XCircle, Zap, RefreshCw, Eye, EyeOff, MessageSquare,
  Bell, Handshake, ArrowUpRight, ArrowDownRight, Target, Rocket,
  Heart, Bookmark, Globe, Shield, ChevronRight, Calendar, Timer,
  AlertTriangle, TrendingDown, Minus, BarChart3, PieChart, Wallet,
  Download, Upload, Search, Filter, MoreVertical, Trash2, Edit,
  Ban, Check, X, ExternalLink, Layers, Box, Monitor, Cpu,
  User, Users, Building2, Mail, Phone, Video,
  Mic, Image, File, Archive, Sparkles,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Avatar from '../../components/marketplace/Avatar';
import RatingDisplay from '../../components/marketplace/RatingDisplay';
import StatusBadge from '../../components/marketplace/StatusBadge';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { freelancerService } from '../../services/freelancerService';
import { proposalService } from '../../services/proposalService';
import { recommendationService } from '../../services/recommendationService';
import { contractService } from '../../services/contractService';
import { financialService } from '../../services/financialService';
import { normalizeFreelancer } from '../../utils/freelancerMapper';
import { normalizeProposal } from '../../utils/proposalMapper';
import { getErrorMessage } from '../../utils/errors';
import { formatETB, formatDate, timeAgo } from '../../utils/format';
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
   MAIN: Freelancer Dashboard
   ═══════════════════════════════════════════════════════════════════════════ */
export default function FreelancerDashboardPage() {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [activeContracts, setActiveContracts] = useState([]);
  const [recentProposals, setRecentProposals] = useState([]);

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    setError(null);
    try {
      const [profileRes, proposalsRes, earningsRes, contractsRes] = await Promise.allSettled([
        freelancerService.getMyProfile(),
        proposalService.getMyProposals({ page: 1 }),
        financialService.getEarnings(),
        contractService.getContracts({ status: 'active', per_page: 5 }),
      ]);

      const profile = profileRes.status === 'fulfilled'
        ? normalizeFreelancer(profileRes.value.data)
        : null;

      const rawProposals = proposalsRes.status === 'fulfilled'
        ? (Array.isArray(proposalsRes.value.data) ? proposalsRes.value.data : (proposalsRes.value.data?.data ?? []))
        : [];
      const proposals = rawProposals.map(normalizeProposal);
      const proposalsTotal = proposalsRes.status === 'fulfilled'
        ? (proposalsRes.value.meta?.total ?? proposalsRes.value.data?.meta?.total ?? proposals.length)
        : proposals.length;

      const earningsData = earningsRes.status === 'fulfilled' ? earningsRes.value : null;
      const contractsData = contractsRes.status === 'fulfilled'
        ? (Array.isArray(contractsRes.value.data) ? contractsRes.value.data : (contractsRes.value.data?.data ?? []))
        : [];

      setData({
        profile,
        proposals,
        proposalsTotal,
      });

      setEarnings(earningsData);
      setActiveContracts(contractsData);
      setRecentProposals(proposals.slice(0, 5));
      setLastUpdated(new Date());

      // Load recommendations
      recommendationService
        .getRecommendedJobs({ per_page: 5 })
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

  // Real-time WebSocket listener for financial events
  useEffect(() => {
    const echoInstance = getEcho();
    if (!echoInstance) return;

    const channel = echoInstance.private(`freelancer.${user?.id}`);

    channel.listen('.finance.milestone_released', (event) => {
      showToast('💰 Payment received! Funds added to your wallet.', 'success');
      loadDashboard(true);
    });

    channel.listen('.finance.withdrawal_requested', (event) => {
      showToast('💸 Withdrawal request submitted!', 'info');
      loadDashboard(true);
    });

    channel.listen('.finance.withdrawal_completed', (event) => {
      showToast('✅ Withdrawal completed!', 'success');
      loadDashboard(true);
    });

    channel.listen('.contract.updated', (event) => {
      loadDashboard(true);
    });

    channel.listen('.proposal.accepted', (event) => {
      showToast('🎉 Your proposal was accepted!', 'success');
      loadDashboard(true);
    });

    return () => {
      channel.stopListening('.finance.milestone_released');
      channel.stopListening('.finance.withdrawal_requested');
      channel.stopListening('.finance.withdrawal_completed');
      channel.stopListening('.contract.updated');
      channel.stopListening('.proposal.accepted');
    };
  }, [user?.id, loadDashboard, showToast]);

  if (loading) return <Skeleton />;
  if (error || !data) {
    return (
      <ErrorState title="Unable to load your dashboard" description={error} onRetry={loadDashboard} />
    );
  }

  const { profile, proposals, proposalsTotal } = data;
  const firstName = (user?.name || profile?.name || 'there').split(' ')[0];

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  /* ── Calculate Stats ──────────────────────────────────────────────────── */
  const s = {
    totalEarned: earnings?.total_earned ?? 0,
    availableBalance: earnings?.available_balance ?? 0,
    pendingBalance: earnings?.pending_balance ?? 0,
    totalWithdrawn: earnings?.total_withdrawn ?? 0,
    activeContractsCount: activeContracts.length,
    completedJobsCount: profile?.completedJobsCount ?? 0,
    totalProposals: proposalsTotal,
    pendingProposals: proposals.filter(p => p.status === 'pending').length,
    acceptedProposals: proposals.filter(p => p.status === 'accepted').length,
    rating: profile?.rating ?? 0,
    responseRate: profile?.responseRate ?? 95,
    successScore: profile?.successScore ?? 85,
  };

  /* ── Profile Strength ──────────────────────────────────────────────────── */
  const profileChecks = [
    { label: 'Profile Photo', done: !!profile?.avatar },
    { label: 'Headline', done: !!profile?.headline },
    { label: 'Bio', done: !!profile?.bio },
    { label: 'Location', done: !!profile?.location },
    { label: 'Skills', done: profile?.skills?.length > 0 },
    { label: 'Hourly Rate', done: !!profile?.hourlyRate },
  ];
  const profileStrength = Math.round((profileChecks.filter(c => c.done).length / profileChecks.length) * 100);

  /* ── Build Activity Feed ────────────────────────────────────────────── */
  const activityItems = [
    ...(s.activeContractsCount > 0 ? [{
      icon: Handshake, color: 'info',
      title: `${s.activeContractsCount} Active Contract${s.activeContractsCount !== 1 ? 's' : ''}`,
      description: 'Currently working on',
      time: 'Now',
      link: '/freelancer/contracts',
    }] : []),
    ...(s.pendingProposals > 0 ? [{
      icon: Send, color: 'warning',
      title: `${s.pendingProposals} Pending Proposal${s.pendingProposals !== 1 ? 's' : ''}`,
      description: 'Awaiting employer response',
      time: 'Pending',
      link: '/freelancer/proposals',
    }] : []),
    ...(s.acceptedProposals > 0 ? [{
      icon: CheckCircle2, color: 'success',
      title: `${s.acceptedProposals} Accepted Proposal${s.acceptedProposals !== 1 ? 's' : ''}`,
      description: 'Ready to start work',
      time: 'Accepted',
      link: '/freelancer/proposals',
    }] : []),
    ...(s.totalEarned > 0 ? [{
      icon: DollarSign, color: 'success',
      title: 'Earnings Available',
      description: `${formatCurrency(s.availableBalance)} ready for withdrawal`,
      time: 'Finance',
      link: '/freelancer/withdrawals',
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
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-gray-200 bg-gray-100 shadow-lg">
                {profile?.avatar
                  ? <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                  : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-gray-600">
                      {(profile?.name || firstName).charAt(0).toUpperCase()}
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
                  {profile?.headline || 'Freelancer on DreamMore'}
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
            {/* Available Balance */}
            <div className={cn(
              'rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 transition-all duration-500',
              isRefreshing && 'animate-pulse'
            )}>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                  <Wallet className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Available</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {formatCurrency(s.availableBalance)}
              </p>
              <p className="text-xs text-emerald-600 mt-2">Ready for withdrawal</p>
            </div>

            {/* Pending Balance */}
            <div className={cn(
              'rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-4 transition-all duration-500',
              isRefreshing && 'animate-pulse'
            )}>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Pending</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {formatCurrency(s.pendingBalance)}
              </p>
              <p className="text-xs text-amber-600 mt-2">Awaiting clearance</p>
            </div>

            {/* Total Earned */}
            <div className={cn(
              'rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 transition-all duration-500
              isRefreshing && 'animate-pulse'
            )}>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Total Earned</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {formatCurrency(s.totalEarned)}
              </p>
              <p className="text-xs text-blue-600 mt-2">All time earnings</p>
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
                {s.activeContractsCount}
              </p>
              <p className="text-xs text-violet-600 mt-2">{s.completedJobsCount} completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         PERFORMANCE METRICS — Like Fiverr
         ═══════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader
          title="Performance Metrics"
          description="Your freelancer scorecard"
          action={
            <Link to="/freelancer/profile" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              View Profile <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <CardBody>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <PerformanceMetric
              icon={Star}
              label="Rating"
              value={s.rating.toFixed(1)}
              maxValue={5}
              color="warning"
            />
            <PerformanceMetric
              icon={Target}
              label="Success Score"
              value={s.successScore}
              maxValue={100}
              color="success"
              suffix="%"
            />
            <PerformanceMetric
              icon={Zap}
              label="Response Rate"
              value={s.responseRate}
              maxValue={100}
              color="info"
              suffix="%"
            />
            <PerformanceMetric
              icon={CheckCircle2}
              label="Jobs Completed"
              value={s.completedJobsCount}
              maxValue={Math.max(s.completedJobsCount, 10)}
              color="brand"
            />
          </div>
        </CardBody>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════
         PROFILE STRENGTH — Like Fiverr
         ═══════════════════════════════════════════════════════════════════ */}
      {profileStrength < 100 && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <Award className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">Profile Strength: {profileStrength}%</p>
              <p className="text-xs text-amber-700 mt-0.5">Complete your profile to attract more clients</p>
            </div>
            <Link
              to="/freelancer/profile/edit"
              className="shrink-0 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600 transition-all"
            >
              Complete Profile
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {profileChecks.map((check, i) => (
              <span
                key={i}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold',
                  check.done
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                {check.done ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {check.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         TODAY'S AGENDA — Active work items
         ═══════════════════════════════════════════════════════════════════ */}
      {s.activeContractsCount > 0 && (
        <Card>
          <CardHeader
            title="Today's Agenda"
            description="Your active work items"
            action={
              <Link to="/freelancer/contracts" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <CardBody className="p-0">
            <div className="divide-y divide-gray-50">
              {activeContracts.slice(0, 3).map((contract) => (
                <div key={contract.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
                    <Handshake className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{contract.title || `Contract #${contract.id}`}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {contract.employer?.name || 'Employer'} · {formatETB(contract.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="primary" size="xs">{contract.status}</Badge>
                    <Link
                      to={`/freelancer/contracts/${contract.id}`}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         QUICK ACTIONS — Like Fiverr
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <QuickAction icon={Briefcase} label="Find Jobs" description="Browse openings" to="/freelancer/jobs" color="brand" />
        <QuickAction icon={Send} label="Proposals" description={`${s.totalProposals} sent`} to="/freelancer/proposals" color="violet" />
        <QuickAction icon={Handshake} label="Contracts" description={`${s.activeContractsCount} active`} to="/freelancer/contracts" color="emerald" />
        <QuickAction icon={DollarSign} label="Finance" description="Earnings & withdrawals" to="/freelancer/withdrawals" color="amber" />
        <QuickAction icon={MessageSquare} label="Messages" description="Chat with clients" to="/freelancer/messages" color="info" />
        <QuickAction icon={Pencil} label="Edit Profile" description="Update your page" to="/freelancer/profile/edit" color="brand" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         MAIN 2-COLUMN BENTO — Recommendations + Proposals + Activity
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recommended jobs — 2 columns */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink-900">Recommended for you</h2>
              <p className="text-xs text-gray-500 mt-0.5">AI-powered job matches based on your skills</p>
            </div>
            <Link to="/freelancer/jobs" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              View all →
            </Link>
          </div>
          {recommendations.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {recommendations.slice(0, 5).map((rec) => (
                <li key={rec.job?.id} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    to={`/jobs/${rec.job?.id}`}
                    className="block text-sm font-semibold text-ink-900 transition-colors hover:text-indigo-600 line-clamp-1"
                  >
                    {rec.job?.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">{rec.reason}</span>
                    {rec.job?.budget && (
                      <span className="text-xs font-medium text-emerald-600">{formatETB(rec.job.budget)}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No recommendations yet"
              description="Complete your profile to get personalized job matches."
              className="py-8"
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
         RECENT PROPOSALS TABLE
         ═══════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader
          title="Recent Proposals"
          description="Your latest job applications"
          action={
            <Link to="/freelancer/proposals" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <CardBody className="p-0">
          {recentProposals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Job</th>
                    <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                    <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentProposals.map((proposal) => (
                    <tr key={proposal.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <Link
                          to={`/freelancer/proposals/${proposal.id}`}
                          className="text-sm font-semibold text-ink-900 hover:text-indigo-600 line-clamp-1"
                        >
                          {proposal.jobTitle ?? `Proposal #${proposal.id}`}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-ink-900">
                        {formatETB(proposal.bidAmount)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={proposal.status} size="xs" />
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {proposal.createdAtLabel || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Send}
              title="No proposals yet"
              description="Apply to jobs to see your proposals here."
              className="py-8"
            />
          )}
        </CardBody>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════
         PROFILE SUMMARY STRIP
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={profile?.name} src={profile?.avatar} size="lg" variant="brand" />
            <div>
              <p className="font-bold text-ink-900">{profile?.name ?? 'Freelancer'}</p>
              <p className="text-sm text-gray-500">{profile?.headline || 'No headline set'}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                {profile?.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />{profile.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <FolderOpen className="h-3.5 w-3.5" />{profile?.skills?.length || 0} skills
                </span>
                {s.rating > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-400" />
                    {s.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button as={Link} to="/freelancer/profile" variant="outline" size="sm">
              View Profile
            </Button>
            <Button as={Link} to="/freelancer/profile/edit" size="sm">
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
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-gray-200" />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-200" />)}
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
