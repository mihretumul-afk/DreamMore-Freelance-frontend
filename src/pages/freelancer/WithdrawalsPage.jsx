import { useCallback, useEffect, useState } from 'react';
import {
  Wallet, CreditCard, ArrowDownToLine, Clock, CheckCircle2,
  XCircle, AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Filter, X,
} from 'lucide-react';
import Card, { CardBody, CardHeader, CardFooter } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import StatCard from '../../components/dashboard/StatCard';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import paymentService from '../../services/paymentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorMessage } from '../../utils/errors';
import { formatCurrency, formatDate, timeAgo } from '../../utils/format';
import { cn } from '../../utils/cn';

const STATUS_CONFIG = {
  requested:  { tone: 'warning', label: 'Requested',  icon: Clock },
  processing: { tone: 'info',    label: 'Processing', icon: RefreshCw },
  completed:  { tone: 'success', label: 'Completed',  icon: CheckCircle2 },
  failed:     { tone: 'danger',  label: 'Failed',     icon: XCircle },
  cancelled:  { tone: 'neutral', label: 'Cancelled',  icon: XCircle },
};

function WithdrawalStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? { tone: 'neutral', label: status };
  return <Badge tone={config.tone} size="xs" dot>{config.label}</Badge>;
}

function StatSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-card border border-gray-200 bg-white p-5 space-y-3">
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="h-7 w-32 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-gray-100">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 rounded bg-gray-200" />
            <div className="h-3 w-1/2 rounded bg-gray-100" />
          </div>
          <div className="h-5 w-20 rounded bg-gray-200" />
          <div className="h-5 w-24 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export default function WithdrawalsPage() {
  usePageTitle('Withdrawals');
  const { user } = useAuth();
  const { showToast } = useToast();

  // Balance
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBL] = useState(true);

  // Withdrawals list
  const [withdrawals, setWithdrawals] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Payment methods
  const [methods, setMethods] = useState([]);

  // Withdrawal form modal
  const [formOpen, setFormOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [fees, setFees] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Cancel confirm
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // ── Load balance ──────────────────────────────────────────────────
  const loadBalance = useCallback(async () => {
    setBL(true);
    try {
      const res = await paymentService.getBalance();
      setBalance(res.data ?? res);
    } catch { /* non-critical */ }
    finally { setBL(false); }
  }, []);

  // ── Load payment methods ──────────────────────────────────────────
  const loadMethods = useCallback(async () => {
    try {
      const res = await paymentService.getPaymentMethods();
      setMethods(res.data ?? res ?? []);
    } catch { /* non-critical */ }
  }, []);

  // ── Load withdrawals ──────────────────────────────────────────────
  const loadWithdrawals = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      const res = await paymentService.getMyWithdrawals(params);
      const data = res.data ?? res;
      setWithdrawals(Array.isArray(data) ? data : data.data ?? []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load withdrawals.'));
    } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { loadBalance(); loadMethods(); }, [loadBalance, loadMethods]);
  useEffect(() => { loadWithdrawals(); }, [loadWithdrawals]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  // ── Calculate fees when amount changes ────────────────────────────
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) { setFees(null); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await paymentService.calculateFees(parseFloat(amount));
        setFees(res.data ?? res);
      } catch { setFees(null); }
    }, 300);
    return () => clearTimeout(timer);
  }, [amount]);

  // ── Open withdrawal form ──────────────────────────────────────────
  const openForm = () => {
    setAmount('');
    setSelectedMethod(methods.find(m => m.is_default) || methods[0] || null);
    setFees(null);
    setFormError(null);
    setFormOpen(true);
  };

  // ── Submit withdrawal ─────────────────────────────────────────────
  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;

    setSubmitting(true); setFormError(null);
    try {
      await paymentService.requestWithdrawal({
        amount: amt,
        payment_method_id: selectedMethod?.id || undefined,
      });
      showToast('Withdrawal request submitted.', 'success');
      setFormOpen(false);
      loadBalance(); loadWithdrawals();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to submit withdrawal request.'));
    } finally { setSubmitting(false); }
  };

  // ── Cancel withdrawal ─────────────────────────────────────────────
  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await paymentService.cancelWithdrawal(cancelTarget.id);
      showToast('Withdrawal cancelled.', 'success');
      setCancelTarget(null);
      loadBalance(); loadWithdrawals();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to cancel withdrawal.'), 'error');
    } finally { setCancelling(false); }
  };

  const currency = balance?.currency ?? 'ETB';
  const available = balance?.available_earnings ?? 0;
  const minWithdrawal = 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Withdrawals</h1>
          <p className="mt-0.5 text-sm text-gray-500">Request and manage your earnings withdrawals.</p>
        </div>
        <Button onClick={openForm} disabled={available < minWithdrawal}>
          <ArrowDownToLine className="h-4 w-4" /> Request Withdrawal
        </Button>
      </div>

      {/* Balance stats */}
      {balanceLoading ? <StatSkeleton /> : balance ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard icon={Wallet} label="Available Earnings" value={formatCurrency(available, currency)} hint="Ready to withdraw" tone="emerald" />
          <StatCard icon={Clock} label="Pending Earnings" value={formatCurrency(balance.pending_earnings ?? 0, currency)} hint="In escrow" tone="brand" />
          <StatCard icon={ArrowDownToLine} label="Total Withdrawn" value={formatCurrency(balance.withdrawn ?? 0, currency)} hint="All time" />
        </div>
      ) : null}

      {/* Withdrawals list */}
      <Card>
        <CardHeader
          title="Withdrawal History"
          description={`${meta.total} total withdrawal${meta.total !== 1 ? 's' : ''}`}
          action={
            <div className="flex items-center gap-2">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none">
                <option value="">All statuses</option>
                {['requested', 'processing', 'completed', 'failed', 'cancelled'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <button type="button" onClick={loadWithdrawals}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          }
        />

        {error ? (
          <CardBody><ErrorState title="Failed to load" description={error} onRetry={loadWithdrawals} /></CardBody>
        ) : loading ? <TableSkeleton /> : withdrawals.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={ArrowDownToLine}
              title={statusFilter ? 'No withdrawals match filters' : 'No withdrawals yet'}
              description={statusFilter ? 'Try clearing filters.' : 'Your withdrawal history will appear here.'}
              action={!statusFilter && available >= minWithdrawal ? <Button size="sm" onClick={openForm}><ArrowDownToLine className="h-4 w-4" />Request Withdrawal</Button> : null}
            />
          </CardBody>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    {['Reference', 'Amount', 'Fee', 'Net', 'Status', 'Date', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {withdrawals.map(w => (
                    <tr key={w.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3">
                        <p className="font-mono text-xs font-semibold text-ink-800">{w.reference}</p>
                        <p className="text-[10px] text-gray-400">{w.payment_method?.display_label ?? '—'}</p>
                      </td>
                      <td className="px-5 py-3 font-bold text-ink-900">{formatCurrency(w.amount, w.currency ?? currency)}</td>
                      <td className="px-5 py-3 text-gray-500">{formatCurrency(w.fee, w.currency ?? currency)}</td>
                      <td className="px-5 py-3 font-semibold text-success-600">{formatCurrency(w.net_amount, w.currency ?? currency)}</td>
                      <td className="px-5 py-3"><WithdrawalStatusBadge status={w.status} /></td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-400" title={formatDate(w.created_at)}>
                        {timeAgo(w.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        {w.status === 'requested' && (
                          <button type="button" onClick={() => setCancelTarget(w)}
                            className="rounded p-1.5 text-gray-400 hover:bg-danger-50 hover:text-danger-500 text-xs font-medium cursor-pointer">
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta.last_page > 1 && (
              <CardFooter>
                <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
                  <span>Page {meta.current_page} of {meta.last_page} · {meta.total} total</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardFooter>
            )}
          </>
        )}
      </Card>

      {/* ── Request Withdrawal Modal ─────────────────────────────────── */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Request Withdrawal" size="md">
        <div className="space-y-5">
          {/* Available balance */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Available for withdrawal</p>
            <p className="text-xl font-bold text-ink-900">{formatCurrency(available, currency)}</p>
          </div>

          {/* Amount */}
          <div>
            <Input
              label="Withdrawal Amount (ETB)"
              type="number"
              min={minWithdrawal}
              max={available}
              step="0.01"
              placeholder={`Min ${minWithdrawal}`}
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-400">Minimum withdrawal: {formatCurrency(minWithdrawal, currency)}</p>
          </div>

          {/* Payment method */}
          {methods.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-900">Withdraw to</label>
              <div className="space-y-2">
                {methods.map(m => (
                  <button key={m.id} type="button"
                    onClick={() => setSelectedMethod(m)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer',
                      selectedMethod?.id === m.id
                        ? 'border-brand-400 bg-brand-50'
                        : 'border-gray-200 bg-white hover:border-gray-300',
                    )}>
                    <CreditCard className={cn('h-5 w-5', selectedMethod?.id === m.id ? 'text-brand-600' : 'text-gray-400')} />
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{m.display_label || m.nickname || 'Payment Method'}</p>
                      <p className="text-xs text-gray-400">{m.type === 'card' ? `Card •••• ${m.card_last_four || '****'}` : m.type === 'bank_account' ? m.bank_name || 'Bank Account' : m.mobile_provider || 'Mobile Money'}</p>
                    </div>
                    {m.is_default && <Badge tone="primary" size="xs">Default</Badge>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fee breakdown */}
          {fees && parseFloat(amount) > 0 && (
            <div className="rounded-xl border border-gray-100 bg-white divide-y divide-gray-100">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-gray-600">Withdrawal Amount</span>
                <span className="text-sm font-semibold text-ink-900">{formatCurrency(parseFloat(amount), currency)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-gray-600">Withdrawal Fee</span>
                <span className="text-sm font-semibold text-ink-900">-{formatCurrency(fees.processing_fee ?? fees.total_fee ?? 0, currency)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
                <span className="text-sm font-bold text-ink-900">You will receive</span>
                <span className="text-base font-bold text-success-600">{formatCurrency(fees.net ?? parseFloat(amount), currency)}</span>
              </div>
            </div>
          )}

          {/* Error */}
          {formError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{formError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</Button>
            <Button
              loading={submitting}
              onClick={handleSubmit}
              disabled={!amount || parseFloat(amount) < minWithdrawal || parseFloat(amount) > available}
            >
              <ArrowDownToLine className="h-4 w-4" /> Request Withdrawal
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Cancel Confirmation ──────────────────────────────────────── */}
      <Modal open={Boolean(cancelTarget)} onClose={() => setCancelTarget(null)} title="Cancel Withdrawal" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Cancel withdrawal <strong>{cancelTarget?.reference}</strong> for {formatCurrency(cancelTarget?.amount ?? 0, currency)}?
            The reserved amount will be returned to your available balance.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCancelTarget(null)} disabled={cancelling}>Keep Request</Button>
            <Button variant="danger" loading={cancelling} onClick={handleCancel}>Cancel Withdrawal</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
