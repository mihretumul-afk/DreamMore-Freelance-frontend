import { useCallback, useEffect, useState } from 'react';
import {
  CreditCard, TrendingUp, AlertCircle, RefreshCw, Search,
  ChevronLeft, ChevronRight, X, CheckCircle2, RotateCcw,
  Eye, Filter, DollarSign, Percent,
} from 'lucide-react';
import Card, { CardBody, CardHeader, CardFooter } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import StatCard from '../../components/dashboard/StatCard';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { PaymentStatusBadge, PaymentTypeBadge } from '../../components/payments/PaymentStatusBadge';
import TransactionDetailModal from '../../components/payments/TransactionDetailModal';
import paymentService from '../../services/paymentService';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorMessage } from '../../utils/errors';
import { formatCurrency, formatDate, timeAgo } from '../../utils/format';
import { cn } from '../../utils/cn';

function StatSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-card border border-gray-200 bg-white p-5 space-y-3">
          <div className="h-3 w-20 rounded bg-gray-200" /><div className="h-7 w-32 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-gray-100">
      {[...Array(6)].map((_, i) => (
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

export default function PaymentsPage() {
  usePageTitle('Payments — Admin');
  const { can } = useAdminPermissions();
  const { showToast } = useToast();

  const [stats, setStats]         = useState(null);
  const [statsLoading, setSL]     = useState(true);
  const [payments, setPayments]   = useState([]);
  const [meta, setMeta]           = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Filters
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [typeFilter, setType]     = useState('');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [page, setPage]           = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [selectedPayment, setSelected] = useState(null);
  const [confirmVerify, setCVerify]    = useState(null);
  const [confirmRefund, setCRefund]    = useState(null);
  const [refundAmount, setRefundAmt]   = useState('');
  const [refundReason, setRefundReason]= useState('');
  const [actionLoading, setAL]        = useState(false);

  const loadStats = useCallback(async () => {
    setSL(true);
    try {
      const res = await paymentService.getAdminPaymentStats();
      setStats(res.data ?? res);
    } catch { /* non-critical */ }
    finally { setSL(false); }
  }, []);

  const loadPayments = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await paymentService.getAdminPayments({
        page, search: search || undefined, status: statusFilter || undefined,
        type: typeFilter || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined,
      });
      const data = res.data ?? res;
      setPayments(Array.isArray(data) ? data : data.data ?? []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load payments.'));
    } finally { setLoading(false); }
  }, [page, search, statusFilter, typeFilter, dateFrom, dateTo]);

  useEffect(() => { if (can('payments.view')) { loadStats(); loadPayments(); } }, []);
  useEffect(() => { if (can('payments.view')) loadPayments(); }, [loadPayments]);
  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter, dateFrom, dateTo]);

  const handleVerify = async () => {
    setAL(true);
    try {
      await paymentService.verifyPayment(confirmVerify.id);
      showToast('Payment verified.', 'success');
      setCVerify(null); loadPayments(); loadStats();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to verify.'), 'error');
    } finally { setAL(false); }
  };

  const handleRefund = async () => {
    setAL(true);
    try {
      await paymentService.refundPayment(confirmRefund.id, {
        amount: refundAmount ? parseFloat(refundAmount) : undefined,
        reason: refundReason,
      });
      showToast('Refund issued.', 'success');
      setCRefund(null); setRefundAmt(''); setRefundReason('');
      loadPayments(); loadStats();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to issue refund.'), 'error');
    } finally { setAL(false); }
  };

  if (!can('payments.view')) {
    return (
      <EmptyState icon={CreditCard} title="Access Restricted"
        description="You do not have permission to view payments." />
    );
  }

  const currency = 'ETB';
  const hasFilters = search || statusFilter || typeFilter || dateFrom || dateTo;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Payments</h1>
          <p className="mt-0.5 text-sm text-gray-500">Monitor and manage platform payment records.</p>
        </div>
      </div>

      {/* Stats */}
      {statsLoading ? <StatSkeleton /> : stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={TrendingUp}    label="Total Volume"    value={formatCurrency(stats.total_volume ?? 0, currency)} hint="Completed payments" tone="emerald" />
          <StatCard icon={Percent}       label="Total Fees"      value={formatCurrency(stats.total_fees ?? 0, currency)} hint="Platform revenue" tone="brand" />
          <StatCard icon={AlertCircle}   label="Pending"         value={stats.pending_count ?? 0} hint="Awaiting action" tone={stats.pending_count > 0 ? 'brand' : 'ink'} />
          <StatCard icon={RotateCcw}     label="Total Refunded"  value={formatCurrency(stats.total_refunded ?? 0, currency)} hint="All time" />
        </div>
      ) : null}

      {/* Table */}
      <Card>
        <CardHeader
          title="All Payments"
          description={`${meta.total} total`}
          action={
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowFilters(v => !v)}
                className={cn('flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
                  showFilters || hasFilters ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-300 bg-white text-ink-700 hover:bg-gray-50')}>
                <Filter className="h-3.5 w-3.5" /> Filters
                {hasFilters && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  {[search, statusFilter, typeFilter, dateFrom, dateTo].filter(Boolean).length}
                </span>}
              </button>
              <button type="button" onClick={loadPayments}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          }
        />

        {showFilters && (
          <div className="border-b border-gray-100 px-5 py-3">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="search" placeholder="Search reference, name…" value={search} onChange={e => setSearch(e.target.value)}
                  className="h-9 w-full rounded-input border border-gray-300 bg-white pl-9 pr-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none" />
              </div>
              <select value={statusFilter} onChange={e => setStatus(e.target.value)}
                className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none">
                <option value="">All statuses</option>
                {['pending','processing','completed','failed','refunded','cancelled','disputed'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                ))}
              </select>
              <select value={typeFilter} onChange={e => setType(e.target.value)}
                className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none">
                <option value="">All types</option>
                <option value="escrow_funded">Escrow Funded</option>
                <option value="milestone_released">Milestone Released</option>
                <option value="refund">Refund</option>
              </select>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" />
              {hasFilters && (
                <button type="button" onClick={() => { setSearch(''); setStatus(''); setType(''); setDateFrom(''); setDateTo(''); }}
                  className="flex h-9 items-center gap-1.5 rounded-input border border-gray-200 bg-white px-3 text-sm text-gray-500 hover:text-danger-600">
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>
          </div>
        )}

        {error ? (
          <CardBody><ErrorState title="Failed to load" description={error} onRetry={loadPayments} /></CardBody>
        ) : loading ? <TableSkeleton /> : payments.length === 0 ? (
          <CardBody>
            <EmptyState icon={CreditCard} title={hasFilters ? 'No payments match filters' : 'No payments yet'}
              description={hasFilters ? 'Try clearing filters.' : 'Payments will appear here as they occur.'} />
          </CardBody>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    {['Reference','Payer → Payee','Type','Amount','Status','Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3">
                        <p className="font-mono text-xs font-semibold text-ink-800">{p.reference}</p>
                        <p className="text-[10px] text-gray-400" title={formatDate(p.created_at)}>{timeAgo(p.created_at)}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-semibold text-ink-900">{p.payer?.name ?? '—'}</p>
                        <p className="text-xs text-gray-400">→ {p.payee?.name ?? 'Platform'}</p>
                      </td>
                      <td className="px-5 py-3"><PaymentTypeBadge type={p.type} size="xs" /></td>
                      <td className="px-5 py-3">
                        <p className="font-bold text-ink-900">{formatCurrency(p.amount, p.currency ?? currency)}</p>
                        {p.fee > 0 && <p className="text-[10px] text-gray-400">fee {formatCurrency(p.fee, p.currency ?? currency)}</p>}
                      </td>
                      <td className="px-5 py-3"><PaymentStatusBadge status={p.status} size="xs" /></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => {
                            paymentService.getAdminPayment(p.id).then(r => setSelected(r.data ?? r)).catch(() => setSelected(p));
                          }} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-ink-900" title="View">
                            <Eye className="h-4 w-4" />
                          </button>
                          {can('payments.verify') && p.status === 'pending' && (
                            <button type="button" onClick={() => setCVerify(p)}
                              className="rounded p-1.5 text-gray-400 hover:bg-success-50 hover:text-success-600" title="Verify">
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          {can('payments.refund') && p.status === 'completed' && !['refund','platform_fee'].includes(p.type) && (
                            <button type="button" onClick={() => { setCRefund(p); setRefundAmt(String(p.amount)); }}
                              className="rounded p-1.5 text-gray-400 hover:bg-warning-50 hover:text-warning-600" title="Refund">
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
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
                    <Button variant="outline" size="sm" disabled={meta.current_page<=1} onClick={() => setPage(p=>p-1)}><ChevronLeft className="h-4 w-4"/></Button>
                    <Button variant="outline" size="sm" disabled={meta.current_page>=meta.last_page} onClick={() => setPage(p=>p+1)}><ChevronRight className="h-4 w-4"/></Button>
                  </div>
                </div>
              </CardFooter>
            )}
          </>
        )}
      </Card>

      {/* Detail view — reuse TransactionDetailModal adapted for Payment */}
      <Modal open={!!selectedPayment} onClose={() => setSelected(null)} title="Payment Details" size="md">
        {selectedPayment && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm font-bold text-ink-900">{selectedPayment.reference}</p>
                <PaymentStatusBadge status={selectedPayment.status} />
              </div>
            </div>
            {[
              { label: 'Type',          value: <PaymentTypeBadge type={selectedPayment.type} /> },
              { label: 'Amount',        value: formatCurrency(selectedPayment.amount, selectedPayment.currency ?? currency) },
              { label: 'Platform Fee',  value: formatCurrency(selectedPayment.fee ?? 0, selectedPayment.currency ?? currency) },
              { label: 'Net Amount',    value: formatCurrency(selectedPayment.net_amount ?? selectedPayment.amount, selectedPayment.currency ?? currency) },
              { label: 'Payer',         value: selectedPayment.payer ? `${selectedPayment.payer.name} (${selectedPayment.payer.email})` : '—' },
              { label: 'Payee',         value: selectedPayment.payee ? `${selectedPayment.payee.name} (${selectedPayment.payee.email})` : '—' },
              { label: 'Provider',      value: selectedPayment.provider ?? '—' },
              { label: 'Provider Ref',  value: selectedPayment.provider_reference ?? '—' },
              { label: 'Description',   value: selectedPayment.description ?? '—' },
              { label: 'Contract',      value: selectedPayment.contract?.title ?? '—' },
              { label: 'Milestone',     value: selectedPayment.milestone?.title ?? '—' },
              { label: 'Created',       value: formatDate(selectedPayment.created_at) },
              { label: 'Processed',     value: selectedPayment.processed_at ? formatDate(selectedPayment.processed_at) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4 rounded-lg border border-gray-100 bg-white px-4 py-2.5">
                <span className="text-xs font-semibold text-gray-400 shrink-0 min-w-28">{label}</span>
                <span className="text-sm text-ink-900 text-right">{value}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Verify confirm */}
      <Modal open={!!confirmVerify} onClose={() => setCVerify(null)} title="Verify Payment" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Mark payment <strong>{confirmVerify?.reference}</strong> as verified and complete?</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCVerify(null)}>Cancel</Button>
            <Button variant="success" loading={actionLoading} onClick={handleVerify}><CheckCircle2 className="h-4 w-4"/>Verify</Button>
          </div>
        </div>
      </Modal>

      {/* Refund confirm */}
      <Modal open={!!confirmRefund} onClose={() => { setCRefund(null); setRefundAmt(''); setRefundReason(''); }} title="Issue Refund" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Refund for payment <strong>{confirmRefund?.reference}</strong>.</p>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">Refund amount ({confirmRefund?.currency ?? currency})</label>
            <input type="number" value={refundAmount} onChange={e => setRefundAmt(e.target.value)}
              max={confirmRefund?.amount} min="1" step="0.01"
              className="h-10 w-full rounded-input border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" />
            <p className="mt-1 text-xs text-gray-400">Leave at full amount for a complete refund.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">Reason (optional)</label>
            <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} rows={2}
              className="w-full rounded-input border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCRefund(null)}>Cancel</Button>
            <Button variant="danger" loading={actionLoading} onClick={handleRefund}><RotateCcw className="h-4 w-4"/>Issue Refund</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
