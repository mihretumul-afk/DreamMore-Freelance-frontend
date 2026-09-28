import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowDownRight, ArrowUpRight, Clock, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight,
  Wallet, CreditCard, Plus, Trash2, Star, Banknote, TrendingUp,
  RefreshCw, PiggyBank, DollarSign, BadgeDollarSign, Receipt, Download,
  FileText, FileSpreadsheet, ChevronDown, Calendar, X, Shield, Zap, FileDown, ArrowUpCircle
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
import SpendingBreakdownChart from '../../components/charts/SpendingBreakdownChart';
import { financialService } from '../../services/financialService';
import { formatETB, formatDate, getPlatformCurrency } from '../../utils/format';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAuth } from '../../hooks/useAuth';
import { exportTransactionsCSV, exportTransactionsPDF } from '../../utils/exportUtils';
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
  wallet_deposit:   { label: 'Wallet Deposit',  tone: 'success', color: 'emerald' },
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
        ? 'border-brand-400 bg-gradient-to-br from-brand-50/60 to-white dark:from-brand-950/40 dark:to-slate-900 dark:border-brand-500/50 shadow-sm'
        : 'border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            method.is_default ? 'bg-brand-100 dark:bg-brand-950/50' : 'bg-gray-100 dark:bg-slate-800'
          }`}>
            <Icon className={`h-6 w-6 ${method.is_default ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-slate-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-ink-900 dark:text-slate-100">{method.display_label || method.nickname || 'Payment Method'}</h3>
              {method.is_default && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 dark:bg-brand-950/60 px-2.5 py-0.5 text-[11px] font-bold text-brand-700 dark:text-brand-300">
                  <Star className="h-3 w-3 fill-current" /> Default
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">{typeLabels[method.type]} · {method.provider}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!method.is_default && (
            <button
              onClick={() => onSetDefault(method.id)}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors cursor-pointer"
            >
              Set Default
            </button>
          )}
          <button
            onClick={() => onRemove(method.id)}
            className="rounded-xl p-2 text-gray-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */

export default function EmployerFinancePage() {
  usePageTitle('Finance — Employer');
  const { showToast } = useToast();
  const { user } = useAuth();

  const [earnings, setEarnings] = useState(null);
  const [methods, setMethods] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [wdMeta, setWdMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [wdPage, setWdPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [txMeta, setTxMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [txPage, setTxPage] = useState(1);

  // Tab state
  const [activeTab, setActiveTab] = useState('transactions'); // transactions | withdrawals | methods

  // Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Date range filters
  const [txDateFrom, setTxDateFrom] = useState('');
  const [txDateTo, setTxDateTo] = useState('');

  // Chart variant
  const [spendingChartVariant, setSpendingChartVariant] = useState('pie');

  // Budget state
  const [budget, setBudget] = useState(null);
  const [budgetSpending, setBudgetSpending] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ monthly_limit: '', alert_threshold: 80, alerts_enabled: true });
  const [savingBudget, setSavingBudget] = useState(false);

  // Add funds modal
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethodId, setDepositMethodId] = useState('');
  const [depositStep, setDepositStep] = useState('form'); // form | processing | success | error
  const [depositResult, setDepositResult] = useState(null);
  const [depositError, setDepositError] = useState('');

  // Withdraw modal
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethodId, setWithdrawMethodId] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Add method modal
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [methodForm, setMethodForm] = useState({
    type: 'card', provider: 'stripe', nickname: '',
    card_last_four: '', bank_name: '', masked_phone: '', masked_account_number: '',
    card_brand: '', mobile_provider: '',
    account_number: '', bank_code: '',
  });
  const [methodDepositAmount, setMethodDepositAmount] = useState('');
  const [savingMethod, setSavingMethod] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [financeRes, methodRes, txRes, wdRes, budgetRes] = await Promise.all([
        financialService.getEmployerFinance(),
        financialService.getPaymentMethods(),
        financialService.getTransactions({ page: txPage }),
        financialService.getWithdrawals({ page: wdPage }),
        financialService.getBudget(),
      ]);
      setEarnings(financeRes.data ?? null);
      setMethods(methodRes.data ?? []);
      const txData = txRes.data ?? [];
      setTransactions(Array.isArray(txData) ? txData : (txData.data ?? []));
      setTxMeta(txRes.meta ?? txData.meta ?? { current_page: 1, last_page: 1, total: 0 });
      const wdData = wdRes?.data ?? [];
      setWithdrawals(Array.isArray(wdData) ? wdData : (wdData.data ?? []));
      setWdMeta(wdRes?.meta ?? wdData.meta ?? { current_page: 1, last_page: 1, total: 0 });
      if (budgetRes.data) {
        setBudget(budgetRes.data.budget);
        setBudgetSpending(budgetRes.data.spending);
        setBudgetForm({
          monthly_limit: budgetRes.data.budget.monthly_limit || '',
          alert_threshold: budgetRes.data.budget.alert_threshold || 80,
          alerts_enabled: budgetRes.data.budget.alerts_enabled ?? true,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load financial data.');
    } finally {
      setLoading(false);
    }
  }, [txPage, wdPage]);

  const [searchParams, setSearchParams] = useSearchParams();

  // Reload when pagination changes
  useEffect(() => { load(); }, [load]);

  // On page load: check for returned payment reference from Chapa checkout
  useEffect(() => {
    const returnedRef = searchParams.get('ref') || searchParams.get('trx_ref') || searchParams.get('reference');
    const depositReturn = searchParams.get('deposit');

    if (returnedRef || depositReturn) {
      setSearchParams({}, { replace: true });
    }

    // Always load data FIRST so the page shows immediately
    load();

    // If returning from Chapa with a specific reference, verify with server
    if (returnedRef) {
      const sessionKey = `reconciled_dep_${returnedRef}`;
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, '1');

        financialService.reconcileDeposit(returnedRef)
          .then((res) => {
            const data = res.data?.data ?? res.data ?? res;
            const payment = data.payment || {};
            const wallet = data.wallet || {};
            const prevBalance = data.previous_balance ?? Math.max(0, (wallet.available_balance || 0) - (payment.amount || 0));

            if (payment.status === 'completed') {
              setDepositResult({
                payment: payment,
                wallet: wallet,
                previous_balance: prevBalance,
              });
              setDepositStep('success');
              setShowAddFunds(true);
              load();
              showToast(
                `Funds Added Successfully! ${formatETB(payment.amount || 0)} has been added to your available balance.`,
                'success'
              );
            } else if (payment.status === 'pending') {
              showToast('Payment is still processing. Your balance will update automatically once confirmed.', 'info');
            } else if (payment.status === 'failed') {
              showToast(`Payment failed: ${payment.failure_reason || 'Transaction could not be completed.'}`, 'error');
            } else if (payment.status === 'cancelled') {
              showToast('Payment was cancelled.', 'warning');
            }
          })
          .catch(() => {
            load();
            showToast('Payment verification failed. If charged, your balance will update automatically.', 'error');
          });
      }
    }

    // Fire background reconcile for any pending deposits
    financialService.reconcileAllDeposits()
      .then((res) => {
        const data = res.data ?? res;
        if ((data?.reconciled ?? 0) > 0) {
          load();
        }
      })
      .catch(() => { /* reconcile failed — page still shows data */ });

    // Auto-refresh every 30 seconds to catch wallet changes from milestones etc.
    const interval = setInterval(() => {
      load();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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

  const hasTxDateFilter = txDateFrom || txDateTo;

  /* ── Handlers ─────────────────────────────────────────────────────── */

  const handleAddFunds = async () => {
    if (!depositAmount || parseFloat(depositAmount) < 10) {
      showToast('Please enter a valid amount (minimum 10 ETB).', 'error');
      return;
    }
    if (!depositMethodId) {
      showToast('Please select a payment method.', 'error');
      return;
    }
    setDepositStep('processing');
    setDepositError('');
    try {
      const res = await financialService.initiateDeposit(parseFloat(depositAmount), parseInt(depositMethodId));
      const data = res.data;

      // Check if this is a redirect-based provider (Chapa)
      if (data.checkout_url) {
        // Redirect to Chapa checkout
        // When user returns, reconciliation on page load will credit the wallet
        window.location.href = data.checkout_url;
        return;
      }

      // Synchronous provider (sandbox) — show success immediately
      setDepositResult(data);
      setDepositStep('success');
      load(); // Reload wallet data
      showToast('Funds added successfully!', 'success');
    } catch (err) {
      setDepositError(err.response?.data?.message || 'Payment failed. Please try again.');
      setDepositStep('error');
    }
  };

  const resetAddFundsModal = () => {
    setDepositAmount('');
    setDepositMethodId('');
    setDepositStep('form');
    setDepositResult(null);
    setDepositError('');
    setShowAddFunds(false);
  };

  const handleAddMethod = async () => {
    setSavingMethod(true);
    try {
      const methodRes = await financialService.addPaymentMethod(methodForm);
      const newMethodId = methodRes.data?.id;
      const depositAmt = parseFloat(methodDepositAmount) || 0;

      if (depositAmt > 0 && newMethodId) {
        // Also deposit funds using the newly created method
        setSavingMethod(false);
        setDepositMethodId(String(newMethodId));
        setDepositAmount(methodDepositAmount);
        setShowAddMethod(false);
        setMethodForm({ type: 'card', provider: 'stripe', nickname: '', card_last_four: '', bank_name: '', masked_phone: '', masked_account_number: '', card_brand: '', mobile_provider: '', account_number: '', bank_code: '' });
        setMethodDepositAmount('');
        // Open Add Funds modal pre-filled
        setShowAddFunds(true);
        setDepositStep('form');
        await load();
        showToast('Payment method added. Confirm your deposit below.', 'success');
      } else {
        showToast('Payment method added successfully!', 'success');
        setShowAddMethod(false);
        setMethodForm({ type: 'card', provider: 'stripe', nickname: '', card_last_four: '', bank_name: '', masked_phone: '', masked_account_number: '', card_brand: '', mobile_provider: '', account_number: '', bank_code: '' });
        setMethodDepositAmount('');
        await load();
      }
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
    if (!confirm('Are you sure you want to remove this payment method?')) return;
    try {
      await financialService.removePaymentMethod(id);
      showToast('Method removed.', 'success');
      load();
    } catch (err) {
      showToast('Failed to remove method.', 'error');
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawMethodId) { showToast('Please enter amount and select a method.', 'error'); return; }
    if (parseFloat(withdrawAmount) < 100) { showToast('Minimum withdrawal amount is 100 ETB.', 'error'); return; }
    setWithdrawing(true);
    try {
      const res = await financialService.requestWithdrawal(parseFloat(withdrawAmount), parseInt(withdrawMethodId));
      showToast('Withdrawal request submitted successfully!', 'success');
      setShowWithdraw(false);
      setWithdrawAmount('');
      setWithdrawMethodId('');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit withdrawal.', 'error');
    } finally {
      setWithdrawing(false);
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

  const handleDeleteWithdrawal = async (w) => {
    if (!window.confirm(`Delete withdrawal ${w.reference} from your history?`)) return;
    try {
      await financialService.deleteWithdrawal(w.id);
      showToast('Withdrawal history entry deleted.', 'success');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete entry.', 'error');
    }
  };

  const handleDeleteTransaction = async (tx) => {
    if (!window.confirm('Delete this transaction from your history? This only removes it from your view — your balance is not affected.')) return;
    try {
      await financialService.deleteTransaction(tx.id);
      showToast('Transaction history entry deleted.', 'success');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete entry.', 'error');
    }
  };

  const handleSaveBudget = async () => {
    if (!budgetForm.monthly_limit || parseFloat(budgetForm.monthly_limit) <= 0) {
      showToast('Please enter a valid budget amount.', 'error');
      return;
    }
    setSavingBudget(true);
    try {
      const res = await financialService.updateBudget({
        monthly_limit: parseFloat(budgetForm.monthly_limit),
        alert_threshold: parseFloat(budgetForm.alert_threshold),
        alerts_enabled: budgetForm.alerts_enabled,
      });
      setBudget(res.data.budget);
      setBudgetSpending(res.data.spending);
      setShowBudgetModal(false);
      showToast('Budget updated successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update budget.', 'error');
    } finally {
      setSavingBudget(false);
    }
  };

  /* ── Loading / Error ──────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 rounded-3xl bg-gray-200 dark:bg-slate-800" />
        <div className="h-16 rounded-2xl bg-gray-200 dark:bg-slate-800" />
        <div className="h-80 rounded-2xl bg-gray-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (error) return <ErrorState title="Failed to load financial data" description={error} onRetry={load} />;

  const e = earnings || {};

  // Use employer finance data from API
  const totalSpent = e.total_spent || 0;
  const totalFees = e.total_fees || 0;

  /* ── Render ────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ─── Hero Header ─────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 sm:p-8 relative overflow-hidden border border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-brand-100/40 dark:bg-brand-900/20 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-blue-100/40 dark:bg-blue-900/20 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-400">Employer Finance</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-900 dark:text-slate-100">Finance</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Manage your wallet, payment methods, track spending, and view billing history.</p>

          {/* Quick Stats Row */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400">
                  <Wallet className="h-3.5 w-3.5" /> Available Balance
                </div>

              </div>
              <p className="mt-1.5 text-xl font-extrabold text-brand-900 dark:text-brand-100">{formatETB(e.available_balance || 0)}</p>
              <p className="text-[10px] text-brand-500 dark:text-brand-400 mt-0.5">Use for milestones, featured jobs, and more</p>
            </div>
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Clock className="h-3.5 w-3.5" /> In Escrow
              </div>
              <p className="mt-1.5 text-xl font-extrabold text-amber-900 dark:text-amber-100">{formatETB(e.pending_payments || 0)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" /> Total Spent
              </div>
              <p className="mt-1.5 text-xl font-extrabold text-emerald-900 dark:text-emerald-100">{formatETB(totalSpent)}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
                <Receipt className="h-3.5 w-3.5" /> Platform Fees
              </div>
              <p className="mt-1.5 text-xl font-extrabold text-gray-900 dark:text-slate-100">{formatETB(totalFees)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Earnings Chart ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-ink-900 dark:text-slate-100">Monthly Spending</h2>
              <p className="text-xs text-gray-400 dark:text-slate-400">Last 6 months overview</p>
            </div>
          </div>
        </div>
        {transactions.length > 0 ? (
          <EarningsChart transactions={transactions} months={6} direction="debit" barColor="#6366f1" barColorHighlight="#4f46e5" />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-800">
              <TrendingUp className="h-8 w-8 text-gray-300 dark:text-slate-600" />
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-500 dark:text-slate-400">No spending data yet</p>
            <p className="text-xs text-gray-400 dark:text-slate-400">Fund milestones to see your spending chart</p>
          </div>
        )}
      </div>

      {/* ─── Spending by Freelancer ──────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40">
              <span className="text-lg">👥</span>
            </div>
            <div>
              <h2 className="font-bold text-ink-900 dark:text-slate-100">Spending by Freelancer</h2>
              <p className="text-xs text-gray-400 dark:text-slate-400">Breakdown of payments to freelancers</p>
            </div>
          </div>
          <div className="flex gap-1 rounded-xl bg-gray-100 dark:bg-slate-800 p-0.5">
            <button
              onClick={() => setSpendingChartVariant('pie')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                spendingChartVariant === 'pie' ? 'bg-white text-ink-900 dark:bg-slate-700 dark:text-slate-100 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              Pie
            </button>
            <button
              onClick={() => setSpendingChartVariant('bar')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                spendingChartVariant === 'bar' ? 'bg-white text-ink-900 dark:bg-slate-700 dark:text-slate-100 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              Bar
            </button>
          </div>
        </div>
        <SpendingBreakdownChart transactions={transactions} variant={spendingChartVariant} />
      </div>

      {/* ─── Monthly Budget ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40">
              <span className="text-lg">🎯</span>
            </div>
            <div>
              <h2 className="font-bold text-ink-900 dark:text-slate-100">Monthly Budget</h2>
              <p className="text-xs text-gray-400 dark:text-slate-400">{budgetSpending?.month || 'This month'}</p>
            </div>
          </div>
          <Button variant="outline" size="xs" onClick={() => setShowBudgetModal(true)}>
            {budget && budget.monthly_limit > 0 ? 'Edit Budget' : 'Set Budget'}
          </Button>
        </div>

        {budget && budget.monthly_limit > 0 ? (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">Spent</span>
                <span className="text-sm font-bold text-ink-900 dark:text-slate-100">
                  {formatETB(budgetSpending?.current_month || 0)} / {formatETB(budget.monthly_limit)}
                </span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (budgetSpending?.usage_percentage || 0) >= 100
                      ? 'bg-red-500'
                      : (budgetSpending?.usage_percentage || 0) >= (budget.alert_threshold || 80)
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(budgetSpending?.usage_percentage || 0, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400 dark:text-slate-400">{budgetSpending?.usage_percentage || 0}% used</span>
                <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  {formatETB(budgetSpending?.remaining || 0)} remaining
                </span>
              </div>
            </div>

            {/* Alert Status */}
            {budgetSpending?.is_exceeded && (
              <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">Budget exceeded! You have overspent by {formatETB((budgetSpending?.current_month || 0) - budget.monthly_limit)}</p>
              </div>
            )}

            {budgetSpending?.should_alert && !budgetSpending?.is_exceeded && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 p-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Approaching budget limit — {budgetSpending?.usage_percentage || 0}% used</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-3 text-center">
                <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-slate-400">Budget</p>
                <p className="mt-1 text-sm font-bold text-ink-900 dark:text-slate-100">{formatETB(budget.monthly_limit)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-3 text-center">
                <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-slate-400">Spent</p>
                <p className="mt-1 text-sm font-bold text-ink-900 dark:text-slate-100">{formatETB(budgetSpending?.current_month || 0)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-3 text-center">
                <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-slate-400">Alert at</p>
                <p className="mt-1 text-sm font-bold text-ink-900 dark:text-slate-100">{budget.alert_threshold}%</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-800">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="mt-3 font-bold text-ink-900 dark:text-slate-100">No budget set</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
              Set a monthly spending limit to track your expenses and avoid overspending.
            </p>
            <Button variant="primary" size="sm" className="mt-3" onClick={() => setShowBudgetModal(true)}>
              Set Monthly Budget
            </Button>
          </div>
        )}
      </div>

      {/* ─── Quick Actions Bar ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddFunds(true)}
          className="shadow-lg shadow-brand-500/20"
        >
          <ArrowUpCircle className="h-4 w-4" /> Add Funds
        </Button>
        <Button
          variant="success"
          size="sm"
          onClick={() => setShowWithdraw(true)}
          disabled={!e.available_balance || e.available_balance < 100}
          className="shadow-lg shadow-emerald-500/20"
        >
          <ArrowDownRight className="h-4 w-4" /> Request Withdrawal
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowAddMethod(true)}>
          <Plus className="h-4 w-4" /> Add Method
        </Button>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* ─── Tab Navigation ──────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-2xl bg-gray-100 dark:bg-slate-800 p-1">
        {[
          { key: 'transactions', label: 'Billing History', icon: BadgeDollarSign },
          { key: 'withdrawals', label: 'Withdrawal History', icon: ArrowDownRight },
          { key: 'methods', label: 'Payment Methods', icon: CreditCard },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-white text-ink-900 dark:bg-slate-700 dark:text-slate-100 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Billing History Tab ─────────────────────────────────────── */}
      {activeTab === 'transactions' && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-ink-900 dark:text-slate-100">Billing History</h2>
                <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">
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
                      <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 py-1 shadow-xl">
                        <button
                          onClick={() => { exportTransactionsCSV(hasTxDateFilter ? filteredTransactions : transactions, { total: hasTxDateFilter ? filteredTransactions.length : txMeta.total }); setShowExportMenu(false); showToast('CSV exported successfully!', 'success'); }}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                          <div className="text-left">
                            <p className="font-semibold">Export as CSV</p>
                            <p className="text-[10px] text-gray-400 dark:text-slate-400">Spreadsheet format</p>
                          </div>
                        </button>
                        <button
                          onClick={() => { exportTransactionsPDF(hasTxDateFilter ? filteredTransactions : transactions, { total: hasTxDateFilter ? filteredTransactions.length : txMeta.total }); setShowExportMenu(false); showToast('PDF exported successfully!', 'success'); }}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <FileText className="h-4 w-4 text-red-500" />
                          <div className="text-left">
                            <p className="font-semibold">Export as PDF</p>
                            <p className="text-[10px] text-gray-400 dark:text-slate-400">Printable document</p>
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
          <div className="px-6 py-3 bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5" /> Filter by date:
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={txDateFrom}
                onChange={(e) => setTxDateFrom(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800 text-gray-700 dark:text-slate-200 px-3 py-1.5 text-xs focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <span className="text-xs text-gray-400 dark:text-slate-400">to</span>
              <input
                type="date"
                value={txDateTo}
                onChange={(e) => setTxDateTo(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800 text-gray-700 dark:text-slate-200 px-3 py-1.5 text-xs focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            {hasTxDateFilter && (
              <button
                onClick={() => { setTxDateFrom(''); setTxDateTo(''); }}
                className="flex items-center gap-1 rounded-lg bg-red-50 dark:bg-red-950/40 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={BadgeDollarSign} title="No transactions yet" description="Your billing transactions will appear here." />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={Calendar} title="No transactions in this date range" description="Try adjusting your date filters." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-slate-800/50 text-left">
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">Type</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">Description</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 text-right">Amount</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 text-right">Balance</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">Date</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 text-right">Invoice</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {filteredTransactions.map((tx) => {
                    const meta = TX_TYPES[tx.type] || { label: tx.type, color: 'gray' };
                    const isCredit = tx.direction === 'credit';
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-3.5">
                          <Badge tone={meta.tone} size="xs">{meta.label}</Badge>
                        </td>
                        <td className="px-6 py-3.5 text-gray-600 dark:text-slate-300 max-w-xs truncate">{tx.description || '—'}</td>
                        <td className={`px-6 py-3.5 text-right font-bold ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                          {isCredit ? '+' : '−'}{formatETB(Math.abs(tx.amount))}
                        </td>
                        <td className="px-6 py-3.5 text-right text-gray-400 dark:text-slate-400 text-xs">
                          {tx.balance_after != null ? formatETB(tx.balance_after) : '—'}
                        </td>
                        <td className="px-6 py-3.5 text-gray-400 dark:text-slate-400 text-xs whitespace-nowrap">{formatDate(tx.created_at)}</td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => { generateTransactionInvoice(tx, { name: user?.name, email: user?.email, role: user?.role }); showToast('Invoice downloaded!', 'success'); }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                          >
                            <FileDown className="h-3.5 w-3.5" /> PDF
                          </button>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => handleDeleteTransaction(tx)}
                            title="Delete from history"
                            className="rounded-lg p-2 text-gray-300 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
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
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 px-6 py-3">
              <p className="text-xs text-gray-400 dark:text-slate-400">Page {txMeta.current_page} of {txMeta.last_page}</p>
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
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-ink-900 dark:text-slate-100">Withdrawal History</h2>
                <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">
                  {wdMeta.total || 0} withdrawals
                </p>
              </div>
            </div>
          </div>

          {withdrawals.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={ArrowDownRight} title="No withdrawals yet" description="Request a withdrawal to move funds from your wallet to your bank or mobile money account." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-slate-800/50 text-left">
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">Reference</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">Amount</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">Fee</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">Net</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">Status</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">Date</th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {withdrawals.map((w) => {
                    const isPending = w.status === 'requested' || w.status === 'processing';
                    const isCompleted = w.status === 'completed';
                    return (
                      <tr key={w.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-xs text-gray-600 dark:text-slate-400">{w.reference}</td>
                        <td className="px-6 py-3.5 font-bold text-ink-900 dark:text-slate-100">{formatETB(w.amount)}</td>
                        <td className="px-6 py-3.5 text-red-400 text-xs">−{formatETB(w.fee)}</td>
                        <td className="px-6 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">{formatETB(w.net_amount)}</td>
                        <td className="px-6 py-3.5">
                          <Badge tone={isCompleted ? 'success' : isPending ? 'warning' : 'neutral'} size="xs">
                            {w.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-gray-400 dark:text-slate-400 whitespace-nowrap">{formatDate(w.created_at)}</td>
                        <td className="px-6 py-3.5 text-right">
                          {isPending && (
                            <button
                              onClick={() => handleCancelWithdrawal(w.id)}
                              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                          {isCompleted && (
                            <button
                              onClick={() => handleDeleteWithdrawal(w)}
                              title="Delete from history"
                              className="rounded-lg p-2 text-gray-300 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
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
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 px-6 py-3">
              <p className="text-xs text-gray-400 dark:text-slate-400">Page {wdMeta.current_page} of {wdMeta.last_page}</p>
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

      {/* ─── Payment Methods Tab ─────────────────────────────────────── */}
      {activeTab === 'methods' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink-900 dark:text-slate-100">Your Payment Methods</h2>
              <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">Manage how you pay for milestones and services</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowAddMethod(true)}>
              <Plus className="h-4 w-4" /> Add Method
            </Button>
          </div>

          {/* Security Notice */}
          <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/40 p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Secure Payments</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">Your payment information is encrypted and never stored on our servers. All transactions are processed securely.</p>
            </div>
          </div>

          {methods.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-800">
                <CreditCard className="h-8 w-8 text-gray-400 dark:text-slate-400" />
              </div>
              <h3 className="mt-4 font-bold text-ink-900 dark:text-slate-100">No payment methods yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
                Add a card or bank account to fund milestones and pay freelancers.
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

      {/* ─── Add Funds Modal ─────────────────────────────────────────── */}
      <Modal open={showAddFunds} onClose={resetAddFundsModal} title="Add Funds" size="md">
        <div className="space-y-5">
          {depositStep === 'form' && (
            <>
              {/* Current Balance Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-indigo-500 p-6 text-center text-white">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-100">Current Available Balance</p>
                <p className="mt-1 text-3xl font-extrabold">{formatETB(e.available_balance || 0)}</p>
              </div>

              <Input
                label={`Amount (${getPlatformCurrency()})`}
                type="number"
                min="10"
                max="500000"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder={`Minimum 10 ${getPlatformCurrency()}`}
                required
              />

              {methods.length > 0 ? (
                <Select
                  label="Payment Method"
                  value={depositMethodId}
                  onChange={(e) => setDepositMethodId(e.target.value)}
                  required
                >
                  <option value="">Select payment method</option>
                  {methods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_label || m.nickname || `Method #${m.id}`}
                    </option>
                  ))}
                </Select>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center">
                  <CreditCard className="mx-auto h-10 w-10 text-amber-400" />
                  <p className="mt-3 font-bold text-amber-800">No Payment Methods</p>
                  <p className="mt-1 text-xs text-amber-600">Add a payment method first to add funds.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => { resetAddFundsModal(); setShowAddMethod(true); }}>
                    <Plus className="h-3 w-3" /> Add Method
                  </Button>
                </div>
              )}

              {/* Summary */}
              {depositAmount && parseFloat(depositAmount) > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount to add</span>
                    <span className="font-bold text-ink-900">{formatETB(parseFloat(depositAmount) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">New balance</span>
                    <span className="font-bold text-emerald-600">{formatETB((e.available_balance || 0) + (parseFloat(depositAmount) || 0))}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={resetAddFundsModal}>Cancel</Button>
                <Button
                  variant="primary"
                  onClick={handleAddFunds}
                  disabled={!depositAmount || !depositMethodId || methods.length === 0}
                  className="shadow-lg shadow-brand-500/20"
                >
                  <ArrowUpCircle className="h-4 w-4" /> Add Funds
                </Button>
              </div>
            </>
          )}

          {depositStep === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
                <RefreshCw className="h-8 w-8 text-brand-500 animate-spin" />
              </div>
              <p className="mt-4 text-lg font-bold text-ink-900">Processing Payment</p>
              <p className="mt-1 text-sm text-gray-500">Please wait while we confirm your payment...</p>
            </div>
          )}

          {depositStep === 'success' && depositResult && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-emerald-700">Funds Added Successfully</h3>
                <p className="mt-1 text-sm text-gray-500">{formatETB(depositResult.payment.amount)} has been added to your Available Balance.</p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-emerald-700">Previous Balance</span>
                  <span className="text-sm font-bold text-emerald-900">{formatETB(depositResult.previous_balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-emerald-700">Added</span>
                  <span className="text-sm font-bold text-emerald-900">+ {formatETB(depositResult.payment.amount)}</span>
                </div>
                <div className="border-t border-emerald-200 pt-2 flex justify-between">
                  <span className="text-sm font-bold text-emerald-700">New Available Balance</span>
                  <span className="text-lg font-extrabold text-emerald-900">{formatETB(depositResult.wallet.available_balance)}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="primary" onClick={resetAddFundsModal}>Done</Button>
              </div>
            </div>
          )}

          {depositStep === 'error' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-red-700">Payment Failed</h3>
                <p className="mt-1 text-sm text-gray-500 text-center max-w-sm">{depositError}</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={resetAddFundsModal}>Cancel</Button>
                <Button variant="primary" onClick={() => setDepositStep('form')}>Try Again</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ─── Withdraw Modal ─────────────────────────────────────────── */}
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
            label={`Amount (${getPlatformCurrency()})`}
            type="number"
            min="100"
            step="0.01"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder={`Minimum 100 ${getPlatformCurrency()}`}
            required
          />

          {methods.length > 0 && (
            <Select label="Withdraw To" value={withdrawMethodId} onChange={(e) => setWithdrawMethodId(e.target.value)}>
              <option value="">Select where to withdraw</option>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_label || m.nickname || m.bank_name || `Method #${m.id}`}
                </option>
              ))}
            </Select>
          )}

          {/* Fee Breakdown */}
          {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold">{formatETB(parseFloat(withdrawAmount) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fee (1.5%)</span>
                <span className="text-red-500 font-semibold">−{formatETB((parseFloat(withdrawAmount) || 0) * 0.015)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                <span>You'll receive</span>
                <span className="text-emerald-600 text-lg">{formatETB((parseFloat(withdrawAmount) || 0) * 0.985)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowWithdraw(false)}>Cancel</Button>
            <Button
              variant="success"
              loading={withdrawing}
              onClick={handleWithdraw}
              disabled={!withdrawAmount || !withdrawMethodId || methods.length === 0}
              className="shadow-lg shadow-emerald-500/20"
            >
              <ArrowDownRight className="h-4 w-4" /> Request Withdrawal
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Add Method Modal ────────────────────────────────────────── */}
      <Modal open={showAddMethod} onClose={() => setShowAddMethod(false)} title="Add Payment Method" size="md">
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
            placeholder="e.g., Company Visa Card"
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
              <Input label="Bank Name" placeholder="e.g., CBE, Bank of Abyssinia" value={methodForm.bank_name} onChange={(e) => setMethodForm({ ...methodForm, bank_name: e.target.value })} />
              <Input label="Account Number" placeholder="Full account number" value={methodForm.account_number} onChange={(e) => setMethodForm({ ...methodForm, account_number: e.target.value })} />
              <p className="text-xs text-gray-500 -mt-1">This is stored securely and only used for processing withdrawals.</p>
            </>
          )}
          {methodForm.type === 'mobile_money' && (
            <>
              <Input label="Mobile Provider" placeholder="e.g., TeleBirr, CBE Birr" value={methodForm.mobile_provider} onChange={(e) => setMethodForm({ ...methodForm, mobile_provider: e.target.value })} />
              <Input label="Account Number" placeholder="Full phone/account number" value={methodForm.account_number} onChange={(e) => setMethodForm({ ...methodForm, account_number: e.target.value })} />
              <p className="text-xs text-gray-500 -mt-1">This is stored securely and only used for processing withdrawals.</p>
            </>
          )}

          {/* Optional Deposit Amount */}
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpCircle className="h-4 w-4 text-brand-600" />
              <span className="text-sm font-bold text-brand-700">Optional: Add Funds Now</span>
            </div>
            <p className="text-xs text-brand-600 mb-3">Enter an amount to deposit into your Available Balance using this new method.</p>
            <Input
              label={`Deposit Amount (${getPlatformCurrency()})`}
              type="number"
              min="0"
              step="0.01"
              value={methodDepositAmount}
              onChange={(e) => setMethodDepositAmount(e.target.value)}
              placeholder="Leave empty to skip"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowAddMethod(false); setMethodDepositAmount(''); }}>Cancel</Button>
            <Button variant="primary" loading={savingMethod} onClick={handleAddMethod}>
              {methodDepositAmount && parseFloat(methodDepositAmount) > 0 ? (
                <><Plus className="h-4 w-4" /> Add Method & Deposit</>
              ) : (
                <><Plus className="h-4 w-4" /> Add Method</>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Budget Modal ────────────────────────────────────────────── */}
      <Modal open={showBudgetModal} onClose={() => setShowBudgetModal(false)} title="Set Monthly Budget" size="md">
        <div className="space-y-5">
          <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-5 border border-amber-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="text-sm font-bold text-amber-900">Budget Goal</p>
                <p className="text-xs text-amber-700">Set a monthly spending limit to track your expenses</p>
              </div>
            </div>
          </div>

          <Input
            label={`Monthly Budget Limit (${getPlatformCurrency()})`}
            type="number"
            min="100"
            step="100"
            value={budgetForm.monthly_limit}
            onChange={(e) => setBudgetForm({ ...budgetForm, monthly_limit: e.target.value })}
            placeholder="e.g., 50000"
            required
          />

          <div>
            <label className="text-sm font-semibold text-ink-900 mb-2 block">Alert When Spending Reaches</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={budgetForm.alert_threshold}
                onChange={(e) => setBudgetForm({ ...budgetForm, alert_threshold: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className="text-sm font-bold text-ink-900 w-12 text-right">{budgetForm.alert_threshold}%</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">You'll be alerted when spending reaches this percentage</p>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
            <div>
              <p className="text-sm font-semibold text-ink-900">Enable Alerts</p>
              <p className="text-xs text-gray-500">Get notified when approaching budget limit</p>
            </div>
            <button
              onClick={() => setBudgetForm({ ...budgetForm, alerts_enabled: !budgetForm.alerts_enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                budgetForm.alerts_enabled ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  budgetForm.alerts_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {budgetForm.monthly_limit && parseFloat(budgetForm.monthly_limit) > 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Monthly Budget</span>
                <span className="font-semibold">{formatETB(parseFloat(budgetForm.monthly_limit) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Alert Threshold</span>
                <span className="font-semibold text-amber-600">{budgetForm.alert_threshold}%</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="text-gray-500">Alert At</span>
                <span className="font-bold text-amber-700">{formatETB((parseFloat(budgetForm.monthly_limit) || 0) * (budgetForm.alert_threshold / 100))}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowBudgetModal(false)}>Cancel</Button>
            <Button variant="primary" loading={savingBudget} onClick={handleSaveBudget}>
              {budget && budget.monthly_limit > 0 ? 'Update Budget' : 'Set Budget'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
