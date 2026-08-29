import { useCallback, useEffect, useState, useRef } from 'react';
import {
  DollarSign, TrendingUp, Wallet, AlertTriangle, CreditCard, ArrowDownRight,
  CheckCircle2, Clock, RefreshCw, Download, Users, Briefcase, ArrowUpRight,
  Banknote, Shield, Eye, ChevronDown, ChevronLeft, ChevronRight, FileText,
  FileSpreadsheet, Calendar, X, Zap, BarChart3, Filter
} from 'lucide-react';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import EarningsChart from '../../components/charts/EarningsChart';
import SpendingBreakdownChart from '../../components/charts/SpendingBreakdownChart';
import RevenueComparisonChart from '../../components/charts/RevenueComparisonChart';
import { financialService } from '../../services/financialService';
import { formatETB, formatDate } from '../../utils/format';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { exportTransactionsCSV, exportTransactionsPDF, exportAdminPaymentsCSV, exportAdminPaymentsPDF, exportAdminWithdrawalsCSV, exportAdminWithdrawalsPDF } from '../../utils/exportUtils';
import { getEcho } from '../../config/echo';

/* ─── Stat Card ─────────────────────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, sub, color, gradient, trend }) {
  return (
    <div className={`rounded-2xl border ${gradient || 'border-gray-200 bg-white'} p-5 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color || 'bg-gray-100'}`}>
            <Icon className={`h-5 w-5 ${color ? color.replace('bg-', 'text-').replace('-100', '-600') : 'text-gray-500'}`} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
            <p className="text-2xl font-extrabold text-ink-900 mt-0.5">{value}</p>
          </div>
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {sub && <p className="mt-2 text-[11px] text-gray-500">{sub}</p>}
    </div>
  );
}

/* ─── Quick Action Card ─────────────────────────────────────────────────── */

function QuickAction({ icon: Icon, label, description, to, color = 'brand', badge }) {
  const colors = {
    brand:   'bg-brand-500 hover:bg-brand-600',
    emerald: 'bg-emerald-500 hover:bg-emerald-600',
    amber:   'bg-amber-500 hover:bg-amber-600',
    red:     'bg-red-500 hover:bg-red-600',
    blue:    'bg-blue-500 hover:bg-blue-600',
  };
  return (
    <a
      href={to}
      className="group relative flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white transition-transform group-hover:scale-110 ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-ink-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {badge && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </a>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */

export default function FinanceDashboard() {
  usePageTitle('Finance Dashboard — Admin');
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Pagination
  const [paymentMeta, setPaymentMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [paymentPage, setPaymentPage] = useState(1);
  const [withdrawalMeta, setWithdrawalMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [withdrawalPage, setWithdrawalPage] = useState(1);

  // Filters
  const [paymentFilter, setPaymentFilter] = useState('');
  const [withdrawalFilter, setWithdrawalFilter] = useState('');

  // Export menus
  const [showPayExportMenu, setShowPayExportMenu] = useState(false);
  const [showWdExportMenu, setShowWdExportMenu] = useState(false);

  // Last updated timestamp
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(false);

  // Date range filters
  const [payDateFrom, setPayDateFrom] = useState('');
  const [payDateTo, setPayDateTo] = useState('');
  const [wdDateFrom, setWdDateFrom] = useState('');
  const [wdDateTo, setWdDateTo] = useState('');

  const load = useCallback(async (isAutoRefresh = false) => {
    if (isAutoRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [dashRes, payRes, wdRes] = await Promise.all([
        financialService.getFinanceDashboard(),
        financialService.getAdminPayments({
          page: paymentPage,
          status: paymentFilter || undefined,
          date_from: payDateFrom || undefined,
          date_to: payDateTo || undefined,
        }),
        financialService.getAdminWithdrawals({
          page: withdrawalPage,
          status: withdrawalFilter || undefined,
          date_from: wdDateFrom || undefined,
          date_to: wdDateTo || undefined,
        }),
      ]);
      setData(dashRes.data ?? dashRes);
      const payData = payRes.data ?? [];
      setPayments(Array.isArray(payData) ? payData : (payData.data ?? []));
      setPaymentMeta(payRes.meta ?? payData.meta ?? { current_page: 1, last_page: 1, total: 0 });
      const wdData = wdRes.data ?? [];
      setWithdrawals(Array.isArray(wdData) ? wdData : (wdData.data ?? []));
      setWithdrawalMeta(wdRes.meta ?? wdData.meta ?? { current_page: 1, last_page: 1, total: 0 });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load finance dashboard.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [paymentPage, withdrawalPage, paymentFilter, withdrawalFilter, payDateFrom, payDateTo, wdDateFrom, wdDateTo]);

  useEffect(() => { load(); }, [load]);

  // Real-time updates via WebSocket
  useEffect(() => {
    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private('admin.finance');

    channel.listen('.finance.updated', (event) => {
      console.log('[Finance] Real-time update:', event.type, event.data);
      
      // Show toast notification
      const messages = {
        'milestone_funded':     '💰 Milestone funded — new payment received',
        'milestone_released':   '✅ Funds released to freelancer',
        'withdrawal_requested': '💸 Withdrawal requested by freelancer',
        'withdrawal_completed': '✅ Withdrawal completed',
        'payment_completed':    '💳 Payment completed',
        'refund_completed':     '🔄 Refund processed',
      };
      
      const message = messages[event.type] || '📊 Financial update';
      showToast(message, 'info');
      
      // Auto-refresh the dashboard with animation
      load(true);
    });

    setIsLive(true);

    return () => {
      channel.stopListening('.finance.updated');
      setIsLive(false);
    };
  }, [load, showToast]);

  // Polling fallback — refresh every 30 seconds as backup
  useEffect(() => {
    const interval = setInterval(() => {
      load(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const handleApproveWithdrawal = async (id) => {
    try {
      await financialService.approveWithdrawal(id);
      showToast('Withdrawal approved!', 'success');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 rounded-3xl bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl bg-gray-200" />)}
        </div>
        <div className="h-80 rounded-2xl bg-gray-200" />
      </div>
    );
  }

  if (error) return <ErrorState title="Failed to load" description={error} onRetry={load} />;

  const d = data || {};
  const pendingCount = d.withdrawals?.pending || 0;
  const disputedFunds = d.disputed_funds || 0;

  /* ── Render ────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ─── Hero Header ─────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Admin Finance</p>
              <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">Finance Dashboard</h1>
              <p className="mt-1 text-sm text-slate-400">Platform financial overview and key metrics.</p>
            </div>
            <div className="flex items-center gap-3">
              {isLive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                </span>
              )}
              {lastUpdated && (
                <span className="text-[10px] text-slate-400">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={() => load()} className="text-white hover:bg-white/10">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className={`mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 transition-all duration-300 ${isRefreshing ? 'opacity-80' : ''}`}>
            <div className={`rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 transition-all duration-300 ${isRefreshing ? 'animate-pulse' : ''}`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <DollarSign className="h-3.5 w-3.5" /> Total Revenue
              </div>
              <p className="mt-1.5 text-xl font-extrabold text-white transition-all duration-500">{formatETB(d.platform_revenue?.total || 0)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">This month: {formatETB(d.platform_revenue?.monthly || 0)}</p>
            </div>
            <div className={`rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 transition-all duration-300 ${isRefreshing ? 'animate-pulse' : ''}`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                <TrendingUp className="h-3.5 w-3.5" /> Payment Volume
              </div>
              <p className="mt-1.5 text-xl font-extrabold text-white transition-all duration-500">{formatETB(d.payment_volume?.total || 0)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">This month: {formatETB(d.payment_volume?.monthly || 0)}</p>
            </div>
            <div className={`rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 transition-all duration-300 ${isRefreshing ? 'animate-pulse' : ''}`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <Wallet className="h-3.5 w-3.5" /> Held in Escrow
              </div>
              <p className="mt-1.5 text-xl font-extrabold text-white transition-all duration-500">{formatETB(d.held_funds || 0)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Awaiting release</p>
            </div>
            <div className={`rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 transition-all duration-300 ${isRefreshing ? 'animate-pulse' : ''}`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Released Funds
              </div>
              <p className="mt-1.5 text-xl font-extrabold text-white transition-all duration-500">{formatETB(d.released_funds || 0)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Paid to freelancers</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Alert Banners ────────────────────────────────────────────── */}
      {(pendingCount > 0 || disputedFunds > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pendingCount > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">{pendingCount} Pending Withdrawals</p>
                <p className="text-xs text-amber-700">Requires admin approval</p>
              </div>
              <Button variant="outline" size="xs" className="ml-auto" onClick={() => { setActiveTab('withdrawals'); setWithdrawalFilter('requested'); }}>
                Review
              </Button>
            </div>
          )}
          {disputedFunds > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-900">{formatETB(disputedFunds)} Disputed</p>
                <p className="text-xs text-red-700">Funds held in disputed milestones</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Quick Actions ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickAction icon={Users} label="Manage Users" description="View all users" to="/admin/users" color="blue" />
        <QuickAction icon={Briefcase} label="Manage Jobs" description="View all jobs" to="/admin/jobs" color="brand" />
        <QuickAction icon={AlertTriangle} label="Reports" description="Disputes & reports" to="/admin/reports" color="red" badge={disputedFunds > 0 ? '!' : null} />
        <QuickAction icon={Shield} label="Verifications" description="Pending approvals" to="/admin/verifications" color="emerald" />
      </div>

      {/* ─── Secondary Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={ArrowDownRight} label="Completed Withdrawals" value={formatETB(d.withdrawals?.completed || 0)} color="bg-emerald-100" />
        <StatCard icon={Clock} label="Pending Withdrawals" value={String(d.withdrawals?.pending || 0)} color="bg-amber-100" />
        <StatCard icon={AlertTriangle} label="Failed Payments" value={String(d.failed_payments || 0)} color="bg-red-100" />
        <StatCard icon={Banknote} label="Total Refunds" value={formatETB(d.total_refunds || 0)} color="bg-red-100" />
      </div>

      {/* ─── Wallet Summary ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
            <Wallet className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h2 className="font-bold text-ink-900">Freelancer Wallets</h2>
            <p className="text-xs text-gray-400">Aggregate wallet balances across all freelancers</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Total Earned</p>
            <p className="mt-1.5 text-2xl font-extrabold text-emerald-900">{formatETB(d.wallets?.total_earned || 0)}</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">All-time freelancer earnings</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Available Balance</p>
            <p className="mt-1.5 text-2xl font-extrabold text-blue-900">{formatETB(d.wallets?.total_available || 0)}</p>
            <p className="text-[10px] text-blue-600 mt-0.5">Ready for withdrawal</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Pending Balance</p>
            <p className="mt-1.5 text-2xl font-extrabold text-amber-900">{formatETB(d.wallets?.total_pending || 0)}</p>
            <p className="text-[10px] text-amber-600 mt-0.5">Awaiting clearance</p>
          </div>
        </div>
      </div>

      {/* ─── Tab Navigation ──────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-2xl bg-gray-100 p-1">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'payments', label: 'Payments', icon: CreditCard },
          { key: 'withdrawals', label: 'Withdrawals', icon: ArrowDownRight },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-white text-ink-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.key === 'withdrawals' && pendingCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Overview Tab ─────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Revenue Chart */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-bold text-ink-900">Revenue Over Time</h2>
                <p className="text-xs text-gray-400">Monthly platform revenue from fees</p>
              </div>
            </div>
            <EarningsChart transactions={payments.map(p => ({
              ...p,
              direction: 'credit',
              amount: p.platform_fee || p.fee || 0,
            }))} months={6} />
          </div>

          {/* Monthly Revenue Comparison */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-ink-900">Monthly Revenue Comparison</h2>
                <p className="text-xs text-gray-400">Payment volume, platform revenue, and released funds</p>
              </div>
            </div>
            <RevenueComparisonChart data={d.monthly_breakdown || []} />
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-ink-900">Recent Payments</h2>
              <p className="text-xs text-gray-400 mt-0.5">Latest platform transactions</p>
            </div>
            {payments.length === 0 ? (
              <div className="p-8">
                <EmptyState icon={CreditCard} title="No payments yet" description="Payments will appear here." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 text-left">
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Reference</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">From</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">To</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-right">Amount</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-right">Fee</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payments.slice(0, 10).map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-xs text-gray-600">{p.reference}</td>
                        <td className="px-6 py-3.5 text-sm text-gray-700">{p.payer?.name || '—'}</td>
                        <td className="px-6 py-3.5 text-sm text-gray-700">{p.payee?.name || '—'}</td>
                        <td className="px-6 py-3.5 text-right font-bold text-ink-900">{formatETB(p.amount)}</td>
                        <td className="px-6 py-3.5 text-right text-amber-600 text-xs">{formatETB(p.platform_fee || p.fee || 0)}</td>
                        <td className="px-6 py-3.5">
                          <Badge tone={p.status === 'completed' ? 'success' : p.status === 'pending' ? 'warning' : 'danger'} size="xs">
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-gray-400">{formatDate(p.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Payments Tab ─────────────────────────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-ink-900">All Payments</h2>
                <p className="text-xs text-gray-400 mt-0.5">{paymentMeta.total || 0} total payments</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={paymentFilter}
                  onChange={(e) => { setPaymentFilter(e.target.value); setPaymentPage(1); }}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-brand-400 focus:outline-none"
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
                {payments.length > 0 && (
                  <div className="relative">
                    <Button variant="outline" size="xs" onClick={() => setShowPayExportMenu(!showPayExportMenu)} className="flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5" /> Export <ChevronDown className="h-3 w-3" />
                    </Button>
                    {showPayExportMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowPayExportMenu(false)} />
                        <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                          <button onClick={() => { exportAdminPaymentsCSV(payments); setShowPayExportMenu(false); showToast('CSV exported!', 'success'); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                            <div className="text-left"><p className="font-semibold">Export CSV</p><p className="text-[10px] text-gray-400">Spreadsheet</p></div>
                          </button>
                          <button onClick={() => { exportAdminPaymentsPDF(payments); setShowPayExportMenu(false); showToast('PDF exported!', 'success'); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                            <FileText className="h-4 w-4 text-red-500" />
                            <div className="text-left"><p className="font-semibold">Export PDF</p><p className="text-[10px] text-gray-400">Printable</p></div>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <Calendar className="h-3.5 w-3.5" /> Filter by date:
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={payDateFrom}
                onChange={(e) => { setPayDateFrom(e.target.value); setPaymentPage(1); }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={payDateTo}
                onChange={(e) => { setPayDateTo(e.target.value); setPaymentPage(1); }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            {(payDateFrom || payDateTo) && (
              <button
                onClick={() => { setPayDateFrom(''); setPayDateTo(''); }}
                className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          {payments.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={CreditCard} title="No payments found" description="Try adjusting your filters." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 text-left">
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Reference</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Type</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">From</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">To</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-right">Amount</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-right">Fee</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs text-gray-600">{p.reference}</td>
                      <td className="px-6 py-3.5">
                        <Badge tone={p.type === 'escrow_funded' ? 'info' : p.type === 'milestone_released' ? 'success' : 'warning'} size="xs">
                          {p.type?.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-700">{p.payer?.name || '—'}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-700">{p.payee?.name || '—'}</td>
                      <td className="px-6 py-3.5 text-right font-bold text-ink-900">{formatETB(p.amount)}</td>
                      <td className="px-6 py-3.5 text-right text-amber-600 text-xs">{formatETB(p.platform_fee || p.fee || 0)}</td>
                      <td className="px-6 py-3.5">
                        <Badge tone={p.status === 'completed' ? 'success' : p.status === 'pending' ? 'warning' : 'danger'} size="xs">
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-gray-400">{formatDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {paymentMeta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
              <p className="text-xs text-gray-400">Page {paymentMeta.current_page} of {paymentMeta.last_page}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="xs" disabled={paymentPage <= 1} onClick={() => setPaymentPage((p) => p - 1)}>
                  <ChevronLeft className="h-3 w-3" /> Prev
                </Button>
                <Button variant="outline" size="xs" disabled={paymentPage >= paymentMeta.last_page} onClick={() => setPaymentPage((p) => p + 1)}>
                  Next <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Withdrawals Tab ──────────────────────────────────────────── */}
      {activeTab === 'withdrawals' && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-ink-900">All Withdrawals</h2>
                <p className="text-xs text-gray-400 mt-0.5">{withdrawalMeta.total || 0} total withdrawals</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={withdrawalFilter}
                  onChange={(e) => { setWithdrawalFilter(e.target.value); setWithdrawalPage(1); }}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-brand-400 focus:outline-none"
                >
                  <option value="">All Status</option>
                  <option value="requested">Requested</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
                {withdrawals.length > 0 && (
                  <div className="relative">
                    <Button variant="outline" size="xs" onClick={() => setShowWdExportMenu(!showWdExportMenu)} className="flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5" /> Export <ChevronDown className="h-3 w-3" />
                    </Button>
                    {showWdExportMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowWdExportMenu(false)} />
                        <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                          <button onClick={() => { exportAdminWithdrawalsCSV(withdrawals); setShowWdExportMenu(false); showToast('CSV exported!', 'success'); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                            <div className="text-left"><p className="font-semibold">Export CSV</p><p className="text-[10px] text-gray-400">Spreadsheet</p></div>
                          </button>
                          <button onClick={() => { exportAdminWithdrawalsPDF(withdrawals); setShowWdExportMenu(false); showToast('PDF exported!', 'success'); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                            <FileText className="h-4 w-4 text-red-500" />
                            <div className="text-left"><p className="font-semibold">Export PDF</p><p className="text-[10px] text-gray-400">Printable</p></div>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <Calendar className="h-3.5 w-3.5" /> Filter by date:
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={wdDateFrom}
                onChange={(e) => { setWdDateFrom(e.target.value); setWithdrawalPage(1); }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={wdDateTo}
                onChange={(e) => { setWdDateTo(e.target.value); setWithdrawalPage(1); }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            {(wdDateFrom || wdDateTo) && (
              <button
                onClick={() => { setWdDateFrom(''); setWdDateTo(''); }}
                className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          {withdrawals.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={ArrowDownRight} title="No withdrawals found" description="Try adjusting your filters." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 text-left">
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Reference</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">User</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Method</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-right">Amount</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-right">Fee</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-right">Net</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Date</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className={`hover:bg-gray-50/50 transition-colors ${w.status === 'requested' ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-6 py-3.5 font-mono text-xs text-gray-600">{w.reference}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-700">{w.user?.name || '—'}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">{w.paymentMethod?.type || '—'}</td>
                      <td className="px-6 py-3.5 text-right font-bold text-ink-900">{formatETB(w.amount)}</td>
                      <td className="px-6 py-3.5 text-right text-red-400 text-xs">−{formatETB(w.fee)}</td>
                      <td className="px-6 py-3.5 text-right font-bold text-emerald-600">{formatETB(w.net_amount)}</td>
                      <td className="px-6 py-3.5">
                        <Badge tone={w.status === 'completed' ? 'success' : w.status === 'requested' ? 'warning' : w.status === 'processing' ? 'info' : 'danger'} size="xs">
                          {w.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-gray-400">{formatDate(w.created_at)}</td>
                      <td className="px-6 py-3.5">
                        {w.status === 'requested' && (
                          <Button variant="success" size="xs" onClick={() => handleApproveWithdrawal(w.id)}>
                            <CheckCircle2 className="h-3 w-3" /> Approve
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {withdrawalMeta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
              <p className="text-xs text-gray-400">Page {withdrawalMeta.current_page} of {withdrawalMeta.last_page}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="xs" disabled={withdrawalPage <= 1} onClick={() => setWithdrawalPage((p) => p - 1)}>
                  <ChevronLeft className="h-3 w-3" /> Prev
                </Button>
                <Button variant="outline" size="xs" disabled={withdrawalPage >= withdrawalMeta.last_page} onClick={() => setWithdrawalPage((p) => p + 1)}>
                  Next <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
