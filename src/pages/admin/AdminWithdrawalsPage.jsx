import { useCallback, useEffect, useState } from 'react';
import {
  Banknote, Search, ChevronLeft, ChevronRight, RefreshCw,
  Eye, Filter, X, CheckCircle2, XCircle, Clock, AlertCircle,
} from 'lucide-react';
import Card, { CardBody, CardHeader, CardFooter } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import StatCard from '../../components/dashboard/StatCard';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import paymentService from '../../services/paymentService';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
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
  rejected:   { tone: 'danger',  label: 'Rejected',   icon: XCircle },
  cancelled:  { tone: 'neutral', label: 'Cancelled',  icon: XCircle },
};

function WithdrawalStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? { tone: 'neutral', label: status };
  return <Badge tone={config.tone} size="xs" dot>{config.label}</Badge>;
}

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

export default function AdminWithdrawalsPage() {
  usePageTitle('Withdrawals — Admin');
  const { can } = useAdminPermissions();
  const { showToast } = useToast();

  const [withdrawals, setWithdrawals] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Action modals
  const [confirmProcess, setConfirmProcess] = useState(null);
  const [confirmComplete, setConfirmComplete] = useState(null);
  const [confirmReject, setConfirmReject] = useState(null);
  const [confirmFail, setConfirmFail] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [failReason, setFailReason] = useState('');
  const [processNote, setProcessNote] = useState('');
  const [completeNote, setCompleteNote] = useState('');
  const [actionLoading, setAL] = useState(false);

  const loadWithdrawals = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await paymentService.getAdminWithdrawals({
        page, search: search || undefined, status: statusFilter || undefined,
      });
      const data = res.data ?? res;
      setWithdrawals(Array.isArray(data) ? data : data.data ?? []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load withdrawals.'));
    } finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { if (can('withdrawals.view')) loadWithdrawals(); }, [loadWithdrawals]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const handleProcess = async () => {
    setAL(true);
    try {
      await paymentService.processWithdrawal(confirmProcess.id, { note: processNote || undefined });
      showToast('Withdrawal processing initiated.', 'success');
      setConfirmProcess(null); setProcessNote('');
      loadWithdrawals();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to process.'), 'error');
    } finally { setAL(false); }
  };

  const handleComplete = async () => {
    setAL(true);
    try {
      await paymentService.completeWithdrawal(confirmComplete.id, { note: completeNote || undefined });
      showToast('Withdrawal completed.', 'success');
      setConfirmComplete(null); setCompleteNote('');
      loadWithdrawals();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to complete.'), 'error');
    } finally { setAL(false); }
  };

  const handleReject = async () => {
    if (!rejectReason || rejectReason.length < 5) return;
    setAL(true);
    try {
      await paymentService.rejectWithdrawal(confirmReject.id, { reason: rejectReason });
      showToast('Withdrawal rejected.', 'success');
      setConfirmReject(null); setRejectReason('');
      loadWithdrawals();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to reject.'), 'error');
    } finally { setAL(false); }
  };

  const handleFail = async () => {
    if (!failReason || failReason.length < 5) return;
    setAL(true);
    try {
      await paymentService.failWithdrawal(confirmFail.id, { reason: failReason });
      showToast('Withdrawal marked as failed.', 'success');
      setConfirmFail(null); setFailReason('');
      loadWithdrawals();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to mark as failed.'), 'error');
    } finally { setAL(false); }
  };

  if (!can('withdrawals.view')) {
    return (
      <EmptyState icon={Banknote} title="Access Restricted"
        description="You do not have permission to view withdrawals." />
    );
  }

  const hasFilters = search || statusFilter;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Withdrawals</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage freelancer withdrawal requests.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Clock} label="Pending" value={withdrawals.filter(w => w.status === 'requested').length} hint="Awaiting action" tone={withdrawals.some(w => w.status === 'requested') ? 'brand' : 'ink'} />
        <StatCard icon={RefreshCw} label="Processing" value={withdrawals.filter(w => w.status === 'processing').length} hint="In progress" />
        <StatCard icon={CheckCircle2} label="Completed" value={withdrawals.filter(w => w.status === 'completed').length} hint="All time" tone="emerald" />
        <StatCard icon={XCircle} label="Rejected/Failed" value={withdrawals.filter(w => ['rejected', 'failed'].includes(w.status)).length} hint="All time" />
      </div>

      {/* Table */}
      <Card>
        <CardHeader
          title="All Withdrawals"
          description={`${meta.total} total`}
          action={
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowFilters(v => !v)}
                className={cn('flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
                  showFilters || hasFilters ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-300 bg-white text-ink-700 hover:bg-gray-50')}>
                <Filter className="h-3.5 w-3.5" /> Filters
              </button>
              <button type="button" onClick={loadWithdrawals}
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
                <input type="search" placeholder="Search reference, name, email…" value={search} onChange={e => setSearch(e.target.value)}
                  className="h-9 w-full rounded-input border border-gray-300 bg-white pl-9 pr-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none">
                <option value="">All statuses</option>
                {['requested', 'processing', 'completed', 'failed', 'rejected', 'cancelled'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              {hasFilters && (
                <button type="button" onClick={() => { setSearch(''); setStatusFilter(''); }}
                  className="flex h-9 items-center gap-1.5 rounded-input border border-gray-200 bg-white px-3 text-sm text-gray-500 hover:text-danger-600">
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>
          </div>
        )}

        {error ? (
          <CardBody><ErrorState title="Failed to load" description={error} onRetry={loadWithdrawals} /></CardBody>
        ) : loading ? <TableSkeleton /> : withdrawals.length === 0 ? (
          <CardBody>
            <EmptyState icon={Banknote} title={hasFilters ? 'No results' : 'No withdrawals yet'}
              description={hasFilters ? 'Try clearing filters.' : 'Withdrawal requests will appear here.'} />
          </CardBody>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    {['Reference', 'Freelancer', 'Amount', 'Fee', 'Net', 'Status', 'Date', 'Actions'].map(h => (
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
                      <td className="px-5 py-3">
                        <p className="text-sm font-semibold text-ink-900">{w.user?.name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{w.user?.email}</p>
                      </td>
                      <td className="px-5 py-3 font-bold text-ink-900">{formatCurrency(w.amount, w.currency ?? 'ETB')}</td>
                      <td className="px-5 py-3 text-gray-500">{formatCurrency(w.fee, w.currency ?? 'ETB')}</td>
                      <td className="px-5 py-3 font-semibold text-success-600">{formatCurrency(w.net_amount, w.currency ?? 'ETB')}</td>
                      <td className="px-5 py-3"><WithdrawalStatusBadge status={w.status} /></td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-400" title={formatDate(w.created_at)}>
                        {timeAgo(w.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setSelected(w)}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-ink-900" title="View">
                            <Eye className="h-4 w-4" />
                          </button>
                          {can('withdrawals.manage') && w.status === 'requested' && (
                            <button type="button" onClick={() => setConfirmProcess(w)}
                              className="rounded p-1.5 text-gray-400 hover:bg-info-50 hover:text-info-600" title="Process">
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          )}
                          {can('withdrawals.manage') && w.status === 'processing' && (
                            <button type="button" onClick={() => setConfirmComplete(w)}
                              className="rounded p-1.5 text-gray-400 hover:bg-success-50 hover:text-success-600" title="Complete">
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          {can('withdrawals.manage') && ['requested', 'processing'].includes(w.status) && (
                            <>
                              <button type="button" onClick={() => setConfirmReject(w)}
                                className="rounded p-1.5 text-gray-400 hover:bg-danger-50 hover:text-danger-600" title="Reject">
                                <XCircle className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => setConfirmFail(w)}
                                className="rounded p-1.5 text-gray-400 hover:bg-warning-50 hover:text-warning-600" title="Mark Failed">
                                <AlertCircle className="h-4 w-4" />
                              </button>
                            </>
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
                    <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardFooter>
            )}
          </>
        )}
      </Card>

      {/* ── Detail Modal ──────────────────────────────────────────────── */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Withdrawal Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm font-bold text-ink-900">{selected.reference}</p>
                <WithdrawalStatusBadge status={selected.status} />
              </div>
            </div>
            {[
              { label: 'Freelancer', value: selected.user ? `${selected.user.name} (${selected.user.email})` : '—' },
              { label: 'Amount', value: formatCurrency(selected.amount, selected.currency ?? 'ETB') },
              { label: 'Fee', value: formatCurrency(selected.fee, selected.currency ?? 'ETB') },
              { label: 'Net Amount', value: formatCurrency(selected.net_amount, selected.currency ?? 'ETB') },
              { label: 'Payment Method', value: selected.payment_method?.display_label ?? '—' },
              { label: 'Provider', value: selected.provider ?? '—' },
              { label: 'Processed By', value: selected.processor ? `${selected.processor.name}` : '—' },
              { label: 'Admin Notes', value: selected.admin_notes ?? '—' },
              { label: 'Failure Reason', value: selected.failure_reason ?? '—' },
              { label: 'Rejection Reason', value: selected.rejection_reason ?? '—' },
              { label: 'Created', value: formatDate(selected.created_at) },
              { label: 'Processed At', value: selected.processed_at ? formatDate(selected.processed_at) : '—' },
              { label: 'Completed At', value: selected.completed_at ? formatDate(selected.completed_at) : '—' },
              { label: 'Rejected At', value: selected.rejected_at ? formatDate(selected.rejected_at) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4 rounded-lg border border-gray-100 bg-white px-4 py-2.5">
                <span className="text-xs font-semibold text-gray-400 shrink-0 min-w-28">{label}</span>
                <span className="text-sm text-ink-900 text-right">{value}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── Process Modal ──────────────────────────────────────────────── */}
      <Modal open={!!confirmProcess} onClose={() => { setConfirmProcess(null); setProcessNote(''); }} title="Process Withdrawal" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Mark withdrawal <strong>{confirmProcess?.reference}</strong> as processing?
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">Note (optional)</label>
            <input type="text" value={processNote} onChange={e => setProcessNote(e.target.value)} placeholder="Processing reference…"
              className="h-10 w-full rounded-input border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmProcess(null)}>Cancel</Button>
            <Button variant="primary" loading={actionLoading} onClick={handleProcess}>Process</Button>
          </div>
        </div>
      </Modal>

      {/* ── Complete Modal ─────────────────────────────────────────────── */}
      <Modal open={!!confirmComplete} onClose={() => { setConfirmComplete(null); setCompleteNote(''); }} title="Complete Withdrawal" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Mark withdrawal <strong>{confirmComplete?.reference}</strong> as completed? ETB {confirmComplete?.net_amount} will be disbursed.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">Note (optional)</label>
            <input type="text" value={completeNote} onChange={e => setCompleteNote(e.target.value)} placeholder="Completion reference…"
              className="h-10 w-full rounded-input border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmComplete(null)}>Cancel</Button>
            <Button variant="success" loading={actionLoading} onClick={handleComplete}><CheckCircle2 className="h-4 w-4" /> Complete</Button>
          </div>
        </div>
      </Modal>

      {/* ── Reject Modal ───────────────────────────────────────────────── */}
      <Modal open={!!confirmReject} onClose={() => { setConfirmReject(null); setRejectReason(''); }} title="Reject Withdrawal" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Reject withdrawal <strong>{confirmReject?.reference}</strong> for {formatCurrency(confirmReject?.amount ?? 0, 'ETB')}?
            The reserved amount will be returned to the freelancer's balance.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">Rejection reason (required)</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Explain why this withdrawal is being rejected…"
              className="w-full rounded-input border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
            <p className="mt-1 text-xs text-gray-400">Minimum 5 characters.</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmReject(null)}>Cancel</Button>
            <Button variant="danger" loading={actionLoading} onClick={handleReject} disabled={!rejectReason || rejectReason.length < 5}>
              <XCircle className="h-4 w-4" /> Reject
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Fail Modal ─────────────────────────────────────────────────── */}
      <Modal open={!!confirmFail} onClose={() => { setConfirmFail(null); setFailReason(''); }} title="Mark Withdrawal as Failed" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Mark withdrawal <strong>{confirmFail?.reference}</strong> as failed?
            The reserved amount will be returned to the freelancer's balance.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">Failure reason (required)</label>
            <textarea value={failReason} onChange={e => setFailReason(e.target.value)} rows={3} placeholder="Explain why this withdrawal failed…"
              className="w-full rounded-input border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
            <p className="mt-1 text-xs text-gray-400">Minimum 5 characters.</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmFail(null)}>Cancel</Button>
            <Button variant="danger" loading={actionLoading} onClick={handleFail} disabled={!failReason || failReason.length < 5}>
              <AlertCircle className="h-4 w-4" /> Mark Failed
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
