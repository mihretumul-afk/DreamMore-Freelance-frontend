import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownRight, Clock, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight,
  Wallet, CreditCard, Plus, Trash2, Star, Banknote, TrendingUp, ArrowUpRight,
  RefreshCw, Eye, EyeOff, PiggyBank, DollarSign, BadgeDollarSign, BarChart3,
  Download, FileText, FileSpreadsheet, ChevronDown, Calendar, X, FileDown
} from 'lucide-react';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import EarningsChart from '../../components/charts/EarningsChart';
import { financialService } from '../../services/financialService';
import { formatETB, formatDate } from '../../utils/format';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAuth } from '../../hooks/useAuth';
import { exportTransactionsCSV, exportTransactionsPDF, exportWithdrawalsCSV } from '../../utils/exportUtils';
import { generateTransactionInvoice } from '../../utils/invoiceGenerator';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const TX_TYPES = {
  payment:          { label: 'Payment',         tone: 'success', color: 'emerald' },
  platform_fee:     { label: 'Platform Fee',    tone: 'warning', color: 'amber' },
  processing_fee:   { label: 'Processing Fee',  tone: 'warning', color: 'amber' },
  funds_held:       { label: 'Funds Held',      tone: 'info',    color: 'blue' },
  funds_released:   { label: 'Funds Released',  tone: 'success', color: 'emerald' },
  refund:           { label: 'Refund',          tone: 'info',    color: 'blue' },
  withdrawal:       { label: 'Withdrawal',      tone: 'danger',  color: 'red' },
  withdrawal_fee:   { label: 'Withdrawal Fee',  tone: 'warning', color: 'amber' },
  adjustment:       { label: 'Adjustment',      tone: 'neutral', color: 'gray' },
};

const WD_STATUS = {
  requested:  { tone: 'warning', icon: Clock,          label: 'Requested',  bg: 'bg-amber-50', text: 'text-amber-700' },
  processing: { tone: 'info',    icon: RefreshCw,      label: 'Processing', bg: 'bg-blue-50',  text: 'text-blue-700' },
  completed:  { tone: 'success', icon: CheckCircle2,   label: 'Completed',  bg: 'bg-emerald-50', text: 'text-emerald-700' },
  failed:     { tone: 'danger',  icon: AlertTriangle,  label: 'Failed',     bg: 'bg-red-50',   text: 'text-red-700' },
  cancelled:  { tone: 'neutral', icon: AlertTriangle,  label: 'Cancelled',  bg: 'bg-gray-50',  text: 'text-gray-600' },
};

const METHOD_TYPES = [
  { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
  { value: 'bank', label: 'Bank Account', icon: PiggyBank },
  { value: 'mobile_money', label: 'Mobile Money', icon: Banknote },
];

const PROVIDERS = {
  card: [
    { value: 'stripe', label: 'Stripe' },
    { value: 'telebirr', label: 'TeleBirr' },
  ],
  bank: [
    { value: 'cbe', label: 'CBE (Commercial Bank of Ethiopia)' },
    { value: 'dashen', label: 'Dashen Bank' },
    { value: 'awash', label: 'Awash Bank' },
  ],
  mobile_money: [
    { value: 'telebirr', label: 'TeleBirr' },
    { value: 'mpesa', label: 'M-Pesa' },
  ],
};

const TYPE_ICONS = {
  card: CreditCard,
  bank: PiggyBank,
  mobile_money: Banknote,
};

/* ─── Method Card ───────────────────────────────────────────────────────── */

function MethodCard({ method, onSetDefault, onRemove }) {
  const Icon = TYPE_ICONS[method.type] || CreditCard;
  const typeLabels = { card: 'Card', bank: 'Bank Account', mobile_money: 'Mobile Money' };
  return (
    <div className={`rounded-2xl border-2 p-5 transition-all duration-200 hover:shadow-lg ${
      method.is_default
        ? 'border-brand-400 bg-gradient-to-br from-brand-50/60 to-white shadow-sm'
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            method.is_default ? 'bg-brand-100' : 'bg-gray-100'
          }`}>
            <Icon className={`h-6 w-6 ${method.is_default ? 'text-brand-600' : 'text-gray-500'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-ink-900">{method.display_label || method.nickname || 'Payment Method'}</h3>
              {method.is_default && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-bold text-brand-700">
                  <Star className="h-3 w-3 fill-current" /> Default
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-gray-500">{typeLabels[method.type]} · {method.provider}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!method.is_default && (
            <button
              onClick={() => onSetDefault(method.id)}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
            >
              Set Default
            </button>
          )}
          <button
            onClick={() => onRemove(method.id)}
            className="rounded-xl p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Stat Card ─────────────────────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, sub, color, gradient }) {
  return (
    <div className={`rounded-2xl border ${gradient || 'border-gray-200 bg-white'} p-5 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color || 'bg-gray-100'}`}>
          <Icon className={`h-5 w-5 ${color ? color.replace('bg-', 'text-').replace('-100', '-600') : 'text-gray-500'}`} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
          <p className="text-2xl font-extrabold text-ink-900 mt-0.5">{value}</p>
        </div>
      </div>
      {sub && <p className="mt-2 text-[11px] text-gray-500">{sub}</p>}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */

export default function WithdrawalsPage() {
  usePageTitle('Withdrawals — Freelancer');
  const { showToast } = useToast();
  const { user } = useAuth();

  const [earnings, setEarnings] = useState(null);
  const [methods, setMethods] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [txMeta, setTxMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [txPage, setTxPage] = useState(1);
  const [wdMeta, setWdMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [wdPage, setWdPage] = useState(1);

  // Tab state
  const [activeTab, setActiveTab] = useState('transactions'); // transactions | withdrawals | methods

  // Withdraw modal
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [methodId, setMethodId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Add method modal
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [methodForm, setMethodForm] = useState({
    type: 'card', provider: 'stripe', nickname: '',
    card_last_four: '', bank_name: '', masked_phone: '', masked_account_number: '',
    card_brand: '', mobile_provider: '',
  });
  const [savingMethod, setSavingMethod] = useState(false);

  // Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Date range filters
  const [txDateFrom, setTxDateFrom] = useState('');
  const [txDateTo, setTxDateTo] = useState('');
  const [wdDateFrom, setWdDateFrom] = useState('');
  const [wdDateTo, setWdDateTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [earnRes, methodRes, txRes, wdRes] = await Promise.all([
        financialService.getEarnings(),
        financialService.getPaymentMethods(),
        financialService.getTransactions({ page: txPage }),
        financialService.getWithdrawals({ page: wdPage }),
      ]);
      setEarnings(earnRes.data ?? null);
      setMethods(methodRes.data ?? []);
      const txData = txRes.data ?? [];
      setTransactions(Array.isArray(txData) ? txData : (txData.data ?? []));
      setTxMeta(txRes.meta ?? txData.meta ?? { current_page: 1, last_page: 1, total: 0 });
      const wdData = wdRes.data ?? [];
      setWithdrawals(Array.isArray(wdData) ? wdData : (wdData.data ?? []));
      setWdMeta(wdRes.meta ?? wdData.meta ?? { current_page: 1, last_page: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load financial data.');
    } finally {
      setLoading(false);
    }
  }, [txPage, wdPage]);

  useEffect(() => { load(); }, [load]);

  /* ── Filtered Data ───────────────────────────────────────────────── */

  const filteredTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.created_at);
    if (txDateFrom && txDate < new Date(txDateFrom)) return false;
    if (txDateTo) {
      const to = new Date(txDateTo);
      to.setHours(23, 59, 59, 999);
      if (txDate > to) return false;
    }
    return true;
  });

  const filteredWithdrawals = withdrawals.filter((wd) => {
    const wdDate = new Date(wd.created_at);
    if (wdDateFrom && wdDate < new Date(wdDateFrom)) return false;
    if (wdDateTo) {
      const to = new Date(wdDateTo);
      to.setHours(23, 59, 59, 999);
      if (wdDate > to) return false;
    }
    return true;
  });

  const hasTxDateFilter = txDateFrom || txDateTo;
  const hasWdDateFilter = wdDateFrom || wdDateTo;

  /* ── Handlers ─────────────────────────────────────────────────────── */

  const handleWithdraw = async () => {
    if (!amount || !methodId) { showToast('Please enter amount and select a method.', 'error'); return; }
    setSubmitting(true);
    try {
      await financialService.requestWithdrawal(parseFloat(amount), parseInt(methodId));
      showToast('Withdrawal request submitted successfully!', 'success');
      setShowWithdraw(false);
      setAmount('');
      setMethodId('');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit withdrawal.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelWithdrawal = async (id) => {
    try {
      await financialService.cancelWithdrawal(id);
      showToast('Withdrawal cancelled.', 'success');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel.', 'error');
    }
  };

  const handleAddMethod = async () => {
    setSavingMethod(true);
    try {
      await financialService.addPaymentMethod(methodForm);
      showToast('Withdrawal method added successfully!', 'success');
      setShowAddMethod(false);
      setMethodForm({ type: 'card', provider: 'stripe', nickname: '', card_last_four: '', bank_name: '', masked_phone: '', masked_account_number: '', card_brand: '', mobile_provider: '' });
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add method.', 'error');
    } finally {
      setSavingMethod(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await financialService.setDefaultPaymentMethod(id);
      showToast('Default method updated.', 'success');
      load();
    } catch (err) {
      showToast('Failed to update default.', 'error');
    }
  };

  const handleRemoveMethod = async (id) => {
    if (!confirm('Are you sure you want to remove this withdrawal method?')) return;
    try {
      await financialService.removePaymentMethod(id);
      showToast('Method removed.', 'success');
      load();
    } catch (err) {
      showToast('Failed to remove method.', 'error');
    }
  };

  /* ── Loading / Error ──────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl border border-gray-200 bg-white" />)}
        </div>
        <div className="h-16 rounded-2xl border border-gray-200 bg-white" />
        <div className="h-80 rounded-2xl border border-gray-200 bg-white" />
      </div>
    );
  }

  if (error) return <ErrorState title="Failed to load financial data" description={error} onRetry={load} />;

  const e = earnings || {};

  /* ── Render ────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ─── Hero Header ─────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-br from-white via-gray-50 to-gray-100 p-6 sm:p-8 relative overflow-hidden border border-gray-200 shadow-sm">
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-brand-100/40 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-emerald-100/40 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">My Finances</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-900">Withdrawals</h1>
          <p className="mt-1 text-sm text-gray-500">Track your earnings, manage withdrawal methods, and request payouts.</p>

          {/* Quick Stats Row */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <Wallet className="h-3.5 w-3.5" /> Available
              </div>
              <p className="mt-1.5 text-xl font-extrabold text-emerald-900">{formatETB(e.available_balance || 0)}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-600">
                <Clock className="h-3.5 w-3.5" /> Pending
              </div>
              <p className="mt-1.5 text-xl font-extrabold text-amber-900">{formatETB(e.pending_balance || 0)}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                <TrendingUp className="h-3.5 w-3.5" /> Total Earned
              </div>
              <p className="mt-1.5 text-xl font-extrabold text-blue-900">{formatETB(e.total_earned || 0)}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                <ArrowDownRight className="h-3.5 w-3.5" /> Withdrawn
              </div>
              <p className="mt-1.5 text-xl font-extrabold text-gray-900">{formatETB(e.total_withdrawn || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Earnings Chart ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-ink-900">Monthly Earnings</h2>
              <p className="text-xs text-gray-400">Last 6 months overview</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-gray-500">Earnings</span>
            </div>
          </div>
        </div>
        {transactions.length > 0 ? (
          <EarningsChart transactions={transactions} months={6} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <BarChart3 className="h-8 w-8 text-gray-300" />
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-500">No earnings data yet</p>
            <p className="text-xs text-gray-400">Complete jobs to see your earnings chart</p>
          </div>
        )}
      </div>

      {/* ─── Quick Actions Bar ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="success"
          size="sm"
          onClick={() => setShowWithdraw(true)}
          disabled={!e.available_balance || e.available_balance <= 0}
          className="shadow-lg shadow-emerald-500/20"
        >
          <Banknote className="h-4 w-4" /> Request Withdrawal
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowAddMethod(true)}>
          <Plus className="h-4 w-4" /> Add Method
        </Button>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* ─── Tab Navigation ──────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-2xl bg-gray-100 p-1">
        {[
          { key: 'transactions', label: 'Transaction History', icon: BadgeDollarSign },
          { key: 'withdrawals', label: 'Withdrawal History', icon: ArrowDownRight },
          { key: 'methods', label: 'Withdrawal Methods', icon: CreditCard },
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
          </button>
        ))}
      </div>

      {/* ─── Transaction History Tab ─────────────────────────────────── */}
      {activeTab === 'transactions' && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-ink-900">Transaction History</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {hasTxDateFilter ? `${filteredTransactions.length} of ${txMeta.total || transactions.length} transactions` : `${txMeta.total || 0} transactions`}
                </p>
              </div>
            {transactions.length > 0 && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Export <ChevronDown className="h-3 w-3" />
                </Button>
                {showExportMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                    <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                      <button
                        onClick={() => { exportTransactionsCSV(hasTxDateFilter ? filteredTransactions : transactions, { total: hasTxDateFilter ? filteredTransactions.length : txMeta.total }); setShowExportMenu(false); showToast('CSV exported successfully!', 'success'); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                        <div className="text-left">
                          <p className="font-semibold">Export as CSV</p>
                          <p className="text-[10px] text-gray-400">Spreadsheet format</p>
                        </div>
                      </button>
                      <button
                        onClick={() => { exportTransactionsPDF(hasTxDateFilter ? filteredTransactions : transactions, { total: hasTxDateFilter ? filteredTransactions.length : txMeta.total }); setShowExportMenu(false); showToast('PDF exported successfully!', 'success'); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <FileText className="h-4 w-4 text-red-500" />
                        <div className="text-left">
                          <p className="font-semibold">Export as PDF</p>
                          <p className="text-[10px] text-gray-400">Printable document</p>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
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
                value={txDateFrom}
                onChange={(e) => setTxDateFrom(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="From"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={txDateTo}
                onChange={(e) => setTxDateTo(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="To"
              />
            </div>
            {hasTxDateFilter && (
              <button
                onClick={() => { setTxDateFrom(''); setTxDateTo(''); }}
                className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={BadgeDollarSign} title="No transactions yet" description="Your financial transactions will appear here." />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={Calendar} title="No transactions in this date range" description="Try adjusting your date filters." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 text-left">
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Type</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Description</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-right">Amount</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-right">Fee</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Date</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTransactions.map((tx) => {
                    const meta = TX_TYPES[tx.type] || { label: tx.type, color: 'gray' };
                    const isCredit = tx.direction === 'credit';
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3.5">
                          <Badge tone={meta.tone} size="xs">{meta.label}</Badge>
                        </td>
                        <td className="px-6 py-3.5 text-gray-600 max-w-xs truncate">{tx.description || '—'}</td>
                        <td className={`px-6 py-3.5 text-right font-bold ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isCredit ? '+' : '−'}{formatETB(Math.abs(tx.amount))}
                        </td>
                        <td className="px-6 py-3.5 text-right text-gray-400 text-xs">
                          {tx.fee > 0 ? formatETB(tx.fee) : '—'}
                        </td>
                        <td className="px-6 py-3.5 text-gray-400 text-xs whitespace-nowrap">{formatDate(tx.created_at)}</td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => { generateTransactionInvoice(tx, { name: user?.name, email: user?.email, role: user?.role }); showToast('Invoice downloaded!', 'success'); }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            <FileDown className="h-3.5 w-3.5" /> PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {txMeta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
              <p className="text-xs text-gray-400">Page {txMeta.current_page} of {txMeta.last_page}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="xs" disabled={txMeta.current_page <= 1} onClick={() => setTxPage((p) => p - 1)}>
                  <ChevronLeft className="h-3 w-3" /> Prev
                </Button>
                <Button variant="outline" size="xs" disabled={txMeta.current_page >= txMeta.last_page} onClick={() => setTxPage((p) => p + 1)}>
                  Next <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Withdrawal History Tab ──────────────────────────────────── */}
      {activeTab === 'withdrawals' && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-ink-900">Withdrawal History</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {hasWdDateFilter ? `${filteredWithdrawals.length} of ${wdMeta.total || withdrawals.length} withdrawals` : `${wdMeta.total || 0} withdrawals`}
                </p>
              </div>
              {withdrawals.length > 0 && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => { exportWithdrawalsCSV(hasWdDateFilter ? filteredWithdrawals : withdrawals); showToast('Withdrawals exported as CSV!', 'success'); }}
                  className="flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </Button>
              )}
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
                onChange={(e) => setWdDateFrom(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={wdDateTo}
                onChange={(e) => setWdDateTo(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            {hasWdDateFilter && (
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
              <EmptyState icon={ArrowDownRight} title="No withdrawals yet" description="Request a withdrawal when you have available balance." />
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={Calendar} title="No withdrawals in this date range" description="Try adjusting your date filters." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 text-left">
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Reference</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Amount</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Fee</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Net</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Date</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredWithdrawals.map((w) => {
                    const s = WD_STATUS[w.status] || { tone: 'neutral', label: w.status, bg: 'bg-gray-50', text: 'text-gray-600' };
                    const SIcon = s.icon;
                    return (
                      <tr key={w.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-xs text-gray-600">{w.reference}</td>
                        <td className="px-6 py-3.5 font-bold text-ink-900">{formatETB(w.amount)}</td>
                        <td className="px-6 py-3.5 text-red-400 text-xs">−{formatETB(w.fee)}</td>
                        <td className="px-6 py-3.5 font-bold text-emerald-600">{formatETB(w.net_amount)}</td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${s.bg} ${s.text}`}>
                            <SIcon className="h-3 w-3" /> {s.label}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(w.created_at)}</td>
                        <td className="px-6 py-3.5">
                          {w.status === 'requested' && (
                            <button
                              onClick={() => handleCancelWithdrawal(w.id)}
                              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {wdMeta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
              <p className="text-xs text-gray-400">Page {wdMeta.current_page} of {wdMeta.last_page}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="xs" disabled={wdPage <= 1} onClick={() => setWdPage((p) => p - 1)}>
                  <ChevronLeft className="h-3 w-3" /> Prev
                </Button>
                <Button variant="outline" size="xs" disabled={wdPage >= wdMeta.last_page} onClick={() => setWdPage((p) => p + 1)}>
                  Next <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Withdrawal Methods Tab ──────────────────────────────────── */}
      {activeTab === 'methods' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink-900">Your Withdrawal Methods</h2>
              <p className="text-xs text-gray-400 mt-0.5">Manage how you receive your earnings</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowAddMethod(true)}>
              <Plus className="h-4 w-4" /> Add Method
            </Button>
          </div>

          {methods.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-4 font-bold text-ink-900">No withdrawal methods yet</h3>
              <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                Add a bank account, card, or mobile money to receive your earnings.
              </p>
              <Button variant="primary" size="sm" className="mt-4" onClick={() => setShowAddMethod(true)}>
                <Plus className="h-4 w-4" /> Add Your First Method
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {methods.map((m) => (
                <MethodCard key={m.id} method={m} onSetDefault={handleSetDefault} onRemove={handleRemoveMethod} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Withdraw Modal ──────────────────────────────────────────── */}
      <Modal open={showWithdraw} onClose={() => setShowWithdraw(false)} title="Request Withdrawal" size="md">
        <div className="space-y-5">
          {/* Available Balance Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 p-6 text-center text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Available Balance</p>
            <p className="mt-1 text-4xl font-extrabold">{formatETB(e.available_balance || 0)}</p>
          </div>

          {methods.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center">
              <CreditCard className="mx-auto h-10 w-10 text-amber-400" />
              <p className="mt-3 font-bold text-amber-800">No Withdrawal Methods</p>
              <p className="mt-1 text-xs text-amber-600">Add a method to receive your earnings.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => { setShowWithdraw(false); setShowAddMethod(true); }}>
                <Plus className="h-3 w-3" /> Add Method
              </Button>
            </div>
          )}

          <Input
            label="Amount (ETB)"
            type="number"
            min="100"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Minimum 100 ETB"
            required
          />

          {methods.length > 0 && (
            <Select label="Withdraw To" value={methodId} onChange={(e) => setMethodId(e.target.value)}>
              <option value="">Select where to withdraw</option>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_label || m.nickname || m.bank_name || `Method #${m.id}`}
                </option>
              ))}
            </Select>
          )}

          {/* Fee Breakdown */}
          {amount && parseFloat(amount) > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold">{formatETB(parseFloat(amount) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fee (1.5%)</span>
                <span className="text-red-500 font-semibold">−{formatETB((parseFloat(amount) || 0) * 0.015)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                <span>You'll receive</span>
                <span className="text-emerald-600 text-lg">{formatETB((parseFloat(amount) || 0) * 0.985)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowWithdraw(false)}>Cancel</Button>
            <Button
              variant="success"
              loading={submitting}
              onClick={handleWithdraw}
              disabled={!amount || !methodId || methods.length === 0}
              className="shadow-lg shadow-emerald-500/20"
            >
              <ArrowDownRight className="h-4 w-4" /> Request Withdrawal
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Add Method Modal ────────────────────────────────────────── */}
      <Modal open={showAddMethod} onClose={() => setShowAddMethod(false)} title="Add Withdrawal Method" size="md">
        <div className="space-y-4">
          {/* Type Selection as Cards */}
          <div>
            <label className="text-sm font-semibold text-ink-900 mb-2 block">Method Type</label>
            <div className="grid grid-cols-3 gap-3">
              {METHOD_TYPES.map((t) => {
                const MIcon = t.icon;
                return (
                  <button
                    key={t.value}
                    onClick={() => setMethodForm({ ...methodForm, type: t.value, provider: PROVIDERS[t.value]?.[0]?.value || '' })}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all cursor-pointer ${
                      methodForm.type === t.value
                        ? 'border-brand-400 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <MIcon className="h-6 w-6" />
                    <span className="text-xs font-semibold">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Select
            label="Provider"
            value={methodForm.provider}
            onChange={(e) => setMethodForm({ ...methodForm, provider: e.target.value })}
          >
            {(PROVIDERS[methodForm.type] || []).map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>

          <Input
            label="Nickname"
            placeholder="e.g., My Visa Card"
            value={methodForm.nickname}
            onChange={(e) => setMethodForm({ ...methodForm, nickname: e.target.value })}
          />

          {methodForm.type === 'card' && (
            <>
              <Input label="Card Brand" placeholder="e.g., visa, mastercard" value={methodForm.card_brand} onChange={(e) => setMethodForm({ ...methodForm, card_brand: e.target.value })} />
              <Input label="Last 4 digits" placeholder="4242" value={methodForm.card_last_four} onChange={(e) => setMethodForm({ ...methodForm, card_last_four: e.target.value })} />
            </>
          )}
          {methodForm.type === 'bank' && (
            <>
              <Input label="Bank Name" placeholder="e.g., CBE" value={methodForm.bank_name} onChange={(e) => setMethodForm({ ...methodForm, bank_name: e.target.value })} />
              <Input label="Account Last 4" placeholder="1234" value={methodForm.masked_account_number} onChange={(e) => setMethodForm({ ...methodForm, masked_account_number: e.target.value })} />
            </>
          )}
          {methodForm.type === 'mobile_money' && (
            <>
              <Input label="Mobile Provider" placeholder="e.g., TeleBirr" value={methodForm.mobile_provider} onChange={(e) => setMethodForm({ ...methodForm, mobile_provider: e.target.value })} />
              <Input label="Mobile Number" placeholder="+251911234567" value={methodForm.masked_phone} onChange={(e) => setMethodForm({ ...methodForm, masked_phone: e.target.value })} />
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddMethod(false)}>Cancel</Button>
            <Button variant="primary" loading={savingMethod} onClick={handleAddMethod}>
              <Plus className="h-4 w-4" /> Add Method
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
