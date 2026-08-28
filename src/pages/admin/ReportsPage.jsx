import { useCallback, useEffect, useState } from 'react';
import { Flag, ChevronLeft, ChevronRight, CreditCard, RotateCcw, Lock, DollarSign, TrendingUp, Wallet, AlertOctagon, CheckCircle2 } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import { adminService } from '../../services/adminService';
import { getRevenueSummary, getAdminDisputes, resolveDispute } from '../../services/paymentService';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatETB } from '../../utils/format';
import { cn } from '../../utils/cn';
import { usePageTitle } from '../../hooks/usePageTitle';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

const STATUS_BADGE = {
  pending: 'warning',
  resolved: 'success',
  dismissed: 'neutral',
};

export default function AdminReportsPage() {
  usePageTitle('Reports & Escrow Disputes — Admin');

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);

  // Revenue & Disputes state
  const [revenue, setRevenue] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [disputeModal, setDisputeModal] = useState(null);
  const [disputeResolution, setDisputeResolution] = useState('resolved_release');
  const [disputeNote, setDisputeNote] = useState('');
  const [resolvingDispute, setResolvingDispute] = useState(false);

  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolution, setResolution] = useState('');
  const [paymentAction, setPaymentAction] = useState('hold');
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;

      const [reportsRes, revRes, disputesRes] = await Promise.all([
        adminService.getReports(params),
        getRevenueSummary().catch(() => null),
        getAdminDisputes().catch(() => null),
      ]);

      const payload = reportsRes.data ?? reportsRes;
      setReports(Array.isArray(payload) ? payload : (payload.data ?? []));
      setMeta(reportsRes.meta ?? payload.meta ?? { current_page: 1, last_page: 1, total: 0 });

      if (revRes && revRes.success) {
        setRevenue(revRes.data);
      }
      if (disputesRes && disputesRes.success) {
        setDisputes(disputesRes.data);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load reports.'));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResolveReport = async () => {
    if (!resolveTarget) return;
    setProcessing(true);
    try {
      await adminService.resolveReport(resolveTarget.id, resolution, paymentAction);
      setResolveTarget(null);
      setResolution('');
      setPaymentAction('hold');
      loadData();
    } catch {
      // non-critical
    } finally {
      setProcessing(false);
    }
  };

  const handleDismissReport = async (report) => {
    try {
      await adminService.dismissReport(report.id);
      loadData();
    } catch {
      // non-critical
    }
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!disputeModal) return;
    setResolvingDispute(true);
    try {
      const res = await resolveDispute(disputeModal.id, {
        resolution: disputeResolution,
        resolution_note: disputeNote,
      });
      if (res.success) {
        setDisputeModal(null);
        setDisputeNote('');
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve dispute.');
    } finally {
      setResolvingDispute(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Reports & Escrow Finance</h1>
        <p className="text-sm text-gray-500">
          Review platform disputes, manage revenue reports, and resolve contract escrow holds.
        </p>
      </div>

      {/* ── Revenue Summary Section ──────────────────────────────────── */}
      {revenue && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-ink-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" /> Revenue Summary (Platform Fees)
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <TrendingUp className="h-4 w-4" /> Total Platform Revenue
              </div>
              <p className="mt-1 text-2xl font-extrabold text-emerald-900">
                {formatETB(revenue.total_platform_fee_revenue)}
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-600">8% fee on releases</p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                <DollarSign className="h-4 w-4" /> This Month Revenue
              </div>
              <p className="mt-1 text-2xl font-extrabold text-blue-900">
                {formatETB(revenue.this_month_fee_revenue)}
              </p>
              <p className="mt-0.5 text-[11px] text-blue-600">Current calendar month</p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
                <Wallet className="h-4 w-4" /> Paid Out to Freelancers
              </div>
              <p className="mt-1 text-2xl font-extrabold text-indigo-900">
                {formatETB(revenue.total_paid_to_freelancers)}
              </p>
              <p className="mt-0.5 text-[11px] text-indigo-600">Net after platform fees</p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                <Lock className="h-4 w-4" /> Active Escrow Held
              </div>
              <p className="mt-1 text-2xl font-extrabold text-amber-900">
                {formatETB(revenue.total_escrow_held)}
              </p>
              <p className="mt-0.5 text-[11px] text-amber-600">Secured in contracts</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Escrow Disputes Section ─────────────────────────────── */}
      {disputes && disputes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-ink-900 flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-amber-600" /> Active Escrow Disputes ({disputes.filter(d => d.status === 'open').length} Open)
          </h2>

          <div className="space-y-3">
            {disputes.map((dispute) => (
              <Card key={dispute.id} variant="bordered" className={dispute.status === 'open' ? 'border-amber-200 bg-amber-50/20' : ''}>
                <CardBody>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink-900 text-sm">
                          Dispute #{dispute.id} — Contract: {dispute.contract?.title || `Contract #${dispute.contract_id}`}
                        </span>
                        <Badge tone={dispute.status === 'open' ? 'warning' : 'success'} size="xs">
                          {dispute.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        <strong>Reason:</strong> {dispute.reason}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Raised by {dispute.raised_by?.name || `User #${dispute.raised_by}`} on {formatDate(dispute.created_at)}
                      </p>

                      {dispute.resolution_note && (
                        <p className="text-xs font-medium text-emerald-700 bg-emerald-50 p-2 rounded-lg mt-2">
                          <strong>Resolution Note:</strong> {dispute.resolution_note}
                        </p>
                      )}
                    </div>

                    {dispute.status === 'open' && (
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => {
                          setDisputeModal(dispute);
                          setDisputeResolution('resolved_release');
                          setDisputeNote('');
                        }}
                      >
                        Resolve Dispute
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters & Reports List ───────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <h2 className="text-base font-bold text-ink-900">User Flagged Reports</h2>
        <Card>
          <CardBody>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
          </CardBody>
        </Card>

        {error ? (
          <ErrorState title="Unable to load reports" description={error} onRetry={loadData} />
        ) : loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-card border border-gray-200 bg-white" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={Flag}
            title="No reports"
            description={statusFilter ? `No ${statusFilter} reports found.` : 'No reports found.'}
          />
        ) : (
          <>
            <div className="space-y-3">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardBody>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-ink-900">
                            {report.reason || report.type || 'Report'}
                          </p>
                          <Badge tone={STATUS_BADGE[report.status] || 'neutral'} size="xs">
                            {report.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {report.description || report.message || 'No description provided.'}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Reported by {report.reporter?.name ?? 'Unknown'} · {formatDate(report.created_at ?? report.createdAt)}
                          {report.target && ` · Target: ${report.target_type ?? 'Unknown'} #${report.target.id ?? report.target_id}`}
                        </p>
                      </div>
                      {report.status === 'pending' && (
                        <div className="flex shrink-0 gap-2">
                          <Button
                            variant="success"
                            size="xs"
                            onClick={() => setResolveTarget(report)}
                          >
                            Resolve
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleDismissReport(report)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {meta.last_page > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {meta.current_page} of {meta.last_page}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.current_page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.current_page >= meta.last_page}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Dispute Resolution Modal ─────────────────────────────────── */}
      <Modal
        open={Boolean(disputeModal)}
        onClose={() => setDisputeModal(null)}
        title={`Resolve Dispute #${disputeModal?.id}`}
        description="Choose whether to release funds to the freelancer or refund the employer."
        size="md"
      >
        <form onSubmit={handleResolveDispute} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Resolution Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDisputeResolution('resolved_release')}
                className={cn(
                  'rounded-xl border p-3 text-left transition-all',
                  disputeResolution === 'resolved_release'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500 font-bold'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                )}
              >
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                  <CreditCard className="h-4 w-4" /> Release to Freelancer
                </div>
                <p className="text-[11px] text-gray-500 mt-1 font-normal">
                  Credits net amount to freelancer wallet minus platform fee.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDisputeResolution('resolved_refund')}
                className={cn(
                  'rounded-xl border p-3 text-left transition-all',
                  disputeResolution === 'resolved_refund'
                    ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500 font-bold'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                )}
              >
                <div className="flex items-center gap-1.5 text-xs text-amber-700 font-bold">
                  <RotateCcw className="h-4 w-4" /> Refund to Employer
                </div>
                <p className="text-[11px] text-gray-500 mt-1 font-normal">
                  Returns escrow funds back to employer available balance.
                </p>
              </button>
            </div>
          </div>

          <Textarea
            label="Resolution Note / Reason"
            placeholder="Explain the rationale for this dispute resolution decision..."
            value={disputeNote}
            onChange={(e) => setDisputeNote(e.target.value)}
            rows={3}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setDisputeModal(null)}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={resolvingDispute}>
              {resolvingDispute ? 'Processing...' : 'Confirm Resolution'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Report Resolve Modal ──────────────────────────────────────── */}
      <Modal
        open={Boolean(resolveTarget)}
        onClose={() => { setResolveTarget(null); setResolution(''); setPaymentAction('hold'); }}
        title="Resolve Report"
        description="Provide a resolution and payment decision for this report."
        size="md"
      >
        <div className="space-y-4">
          <Textarea
            label="Resolution notes (optional)"
            placeholder="Describe the action taken or resolution applied."
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={3}
          />

          {resolveTarget?.target_type === 'contract' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-900">
                Payment Decision
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'hold', label: 'Hold Funds', desc: 'Keep funds in escrow until further action', icon: Lock, color: 'gray' },
                  { value: 'release', label: 'Release to Freelancer', desc: 'Release escrow funds to the freelancer', icon: CreditCard, color: 'success' },
                  { value: 'refund', label: 'Refund to Employer', desc: 'Return funds to the employer', icon: RotateCcw, color: 'warning' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentAction(opt.value)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer',
                      paymentAction === opt.value
                        ? 'border-brand-400 bg-brand-50'
                        : 'border-gray-200 bg-white hover:border-gray-300',
                    )}
                  >
                    <opt.icon className="h-5 w-5 shrink-0 text-brand-600" />
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => { setResolveTarget(null); setResolution(''); setPaymentAction('hold'); }}>
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              loading={processing}
              onClick={handleResolveReport}
            >
              Mark Resolved
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
