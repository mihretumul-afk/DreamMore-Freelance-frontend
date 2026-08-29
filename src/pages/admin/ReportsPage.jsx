import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Flag, ChevronLeft, ChevronRight, MessageSquare, User, FileText,
  CheckCircle2, XCircle, Send, ExternalLink, Download, Clock, AlertCircle,
  Banknote, Loader2, ArrowLeft,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';
import { API_BASE_URL } from '../../config/env';

/* ─── Constants ────────────────────────────────────────────────────────── */

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

const MILESTONE_STATUS_LABEL = {
  draft: 'Draft', unfunded: 'Awaiting Funding', funded: 'Funded',
  in_progress: 'In Progress', submitted: 'Submitted', in_review: 'In Review',
  revision_requested: 'Revision Requested', approved: 'Approved',
  released: 'Paid', disputed: 'Disputed', cancelled: 'Cancelled',
};

/* ─── Dispute Detail View ─────────────────────────────────────────────── */

function DisputeDetail({ report, onBack, onRefresh }) {
  const { showToast } = useToast();
  const [noteText, setNoteText] = useState('');
  const [recipientType, setRecipientType] = useState('both');
  const [sendingNote, setSendingNote] = useState(false);
  const [resolveModal, setResolveModal] = useState(null); // 'release' or 'refund'
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);

  const milestone = report.milestone;
  const contract  = report.contract;
  const submissions = milestone?.submissions ?? [];

  // ── Add admin note ─────────────────────────────────────────────────────
  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSendingNote(true);
    try {
      await adminService.addReportNote(report.id, noteText.trim(), recipientType);
      const targetLabel = recipientType === 'freelancer' ? 'Freelancer' : recipientType === 'employer' ? 'Employer' : 'both parties';
      showToast(`Note sent to ${targetLabel}.`, 'success');
      setNoteText('');
      onRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add note.', 'error');
    } finally {
      setSendingNote(false);
    }
  };

  // ── Resolve dispute ────────────────────────────────────────────────────
  const handleResolve = async (resolutionType) => {
    setResolving(true);
    try {
      await adminService.resolveReport(report.id, resolutionNote || null, resolutionType);
      showToast(
        resolutionType === 'release_to_freelancer'
          ? 'Dispute resolved — funds released to freelancer.'
          : 'Dispute resolved — funds refunded to employer.',
        'success'
      );
      setResolveModal(null);
      setResolutionNote('');
      onRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resolve dispute.', 'error');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-ink-900 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to all disputes
      </button>

      {/* ── Dispute Header ──────────────────────────────────────────────── */}
      <Card>
        <CardBody>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
              <Flag className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-ink-900">Dispute #{report.id}</h2>
                <Badge tone={STATUS_BADGE[report.status] || 'neutral'} size="xs">{report.status}</Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">{report.reason}</p>
              {report.description && <p className="text-sm text-gray-500 mt-1">{report.description}</p>}
              <p className="text-xs text-gray-400 mt-2">
                Filed by {report.reporter?.name ?? 'Unknown'} · {formatDate(report.created_at)}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── Contract & Milestone Info ───────────────────────────────────── */}
      {milestone && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardBody>
              <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Contract</p>
              <p className="text-sm font-semibold text-ink-900">{contract?.title || '—'}</p>
              <p className="text-xs text-gray-500 mt-1">Status: {contract?.status || '—'}</p>
              {contract?.employer && (
                <div className="flex items-center gap-2 mt-2">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600">Employer: {contract.employer.name}</span>
                </div>
              )}
              {contract?.freelancer && (
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600">Freelancer: {contract.freelancer.name}</span>
                </div>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Milestone</p>
              <p className="text-sm font-semibold text-ink-900">{milestone.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                Amount: <span className="font-semibold text-ink-900">{formatETB(milestone.amount)}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Status: <Badge tone={milestone.status === 'disputed' ? 'danger' : 'warning'} size="xs">
                  {MILESTONE_STATUS_LABEL[milestone.status] || milestone.status}
                </Badge>
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── Freelancer Submissions ──────────────────────────────────────── */}
      {submissions.length > 0 && (
        <Card>
          <CardBody>
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-3">Freelancer Submissions</p>
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div key={sub.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm text-gray-700">{sub.description || 'No description'}</p>

                  {/* Links */}
                  {sub.links && sub.links.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {sub.links.map((link, i) => (
                        <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs text-brand-600 hover:bg-brand-100 transition-colors">
                          <ExternalLink className="h-3 w-3" /> Link {i + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Files */}
                  {sub.files && sub.files.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] font-bold uppercase text-gray-400">Uploaded Files</p>
                      {sub.files.map((file, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-brand-500 shrink-0" />
                            <span className="text-xs font-medium text-ink-900 truncate">{file.name}</span>
                            <span className="text-[10px] text-gray-400">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                          </div>
                          <a href={`${API_BASE_URL}/milestone-submissions/${file.path}`} target="_blank" rel="noopener noreferrer"
                            className="rounded p-1 text-brand-600 hover:bg-brand-50 transition-colors">
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="mt-2 text-[10px] text-gray-400">
                    Submitted {sub.submitted_at ? formatDate(sub.submitted_at) : ''}
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Admin Notes / Communication ─────────────────────────────────── */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <p className="text-[10px] font-bold uppercase text-gray-400">Admin Notes & Communication</p>
          </div>

          {/* Notes list */}
          {report.notes_list && report.notes_list.length > 0 ? (
            <div className="space-y-3 mb-4">
              {report.notes_list.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink-900">{item.sender_name || 'System'}</span>
                      <Badge tone={item.sender_role === 'admin' ? 'danger' : 'info'} size="xs">
                        {item.sender_role || 'admin'}
                      </Badge>
                      <span className="text-[10px] text-gray-400">Target:</span>
                      <Badge tone={item.recipient_type === 'freelancer' ? 'info' : item.recipient_type === 'employer' ? 'warning' : 'neutral'} size="xs">
                        {item.recipient_type === 'freelancer' ? 'Freelancer Only' : item.recipient_type === 'employer' ? 'Employer Only' : 'Both Parties'}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-gray-400">{item.created_at ? formatDate(item.created_at) : ''}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.note}</p>
                </div>
              ))}
            </div>
          ) : report.admin_notes ? (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-4">
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{report.admin_notes}</p>
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-4 text-center">
              <p className="text-xs text-gray-400 italic">No admin notes yet. Add a note to communicate with either or both parties.</p>
            </div>
          )}

          {/* Add note form */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-600">Send Message To:</label>
              <Select
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value)}
                className="w-48 text-xs"
              >
                <option value="both">Both Parties</option>
                <option value="freelancer">Freelancer Only</option>
                <option value="employer">Employer Only</option>
              </Select>
            </div>
            <Textarea
              placeholder={`Write a note to ${recipientType === 'freelancer' ? 'the freelancer only' : recipientType === 'employer' ? 'the employer only' : 'both parties'}...`}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end mt-2">
            <Button variant="primary" size="sm" loading={sendingNote} onClick={handleAddNote} disabled={!noteText.trim()}>
              <Send className="h-3.5 w-3.5" /> Send Note
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* ── Resolution Actions ──────────────────────────────────────────── */}
      {report.status === 'pending' && (
        <Card>
          <CardBody>
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-3">Resolve Dispute</p>
            <p className="text-sm text-gray-600 mb-4">
              Review the submissions and evidence, then decide the outcome:
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="success" size="sm" onClick={() => setResolveModal('release')}>
                <CheckCircle2 className="h-4 w-4" /> Release Funds to Freelancer
              </Button>
              <Button variant="danger" size="sm" onClick={() => setResolveModal('refund')}>
                <XCircle className="h-4 w-4" /> Refund Funds to Employer
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Resolved Info ───────────────────────────────────────────────── */}
      {report.status === 'resolved' && (
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-ink-900">Dispute Resolved</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {report.resolution_type === 'release_to_freelancer'
                    ? 'Funds released to freelancer'
                    : report.resolution_type === 'refund_to_employer'
                    ? 'Funds refunded to employer'
                    : report.resolution || 'Resolved'}
                  {report.resolution_amount && ` · ${formatETB(report.resolution_amount)}`}
                </p>
                {report.resolution && (
                  <p className="text-xs text-gray-400 mt-1">{report.resolution}</p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Resolve Confirmation Modal ──────────────────────────────────── */}
      <Modal open={Boolean(resolveModal)} onClose={() => { setResolveModal(null); setResolutionNote(''); }} title="Resolve Dispute" size="md">
        <div className="space-y-4">
          <div className={`rounded-xl p-4 text-center ${
            resolveModal === 'release'
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            {resolveModal === 'release' ? (
              <>
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                <p className="mt-2 text-sm font-semibold text-emerald-800">Release Funds to Freelancer?</p>
                <p className="text-xs text-emerald-600 mt-1">
                  Freelancer wins the dispute. {formatETB(milestone?.amount || 0)} will be released to their wallet.
                </p>
              </>
            ) : (
              <>
                <XCircle className="mx-auto h-8 w-8 text-red-500" />
                <p className="mt-2 text-sm font-semibold text-red-800">Refund Funds to Employer?</p>
                <p className="text-xs text-red-600 mt-1">
                  Employer wins the dispute. {formatETB(milestone?.amount || 0)} will be refunded.
                </p>
              </>
            )}
          </div>

          <Textarea
            label="Resolution Note (optional)"
            placeholder="Explain your decision for both parties..."
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setResolveModal(null); setResolutionNote(''); }}>Cancel</Button>
            <Button
              variant={resolveModal === 'release' ? 'success' : 'danger'}
              loading={resolving}
              onClick={() => handleResolve(resolveModal === 'release' ? 'release_to_freelancer' : 'refund_to_employer')}
            >
              {resolveModal === 'release'
                ? <><CheckCircle2 className="h-4 w-4" /> Release Funds</>
                : <><XCircle className="h-4 w-4" /> Refund Funds</>
              }
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ─── Reports List View ───────────────────────────────────────────────── */

export default function AdminReportsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  usePageTitle('Disputes — Admin');
  const { showToast } = useToast();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);

  // Detail view
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;

      const reportsRes = await adminService.getReports(params);
      const payload = reportsRes.data ?? reportsRes;
      setReports(Array.isArray(payload) ? payload : (payload.data ?? []));
      setMeta(reportsRes.meta ?? payload.meta ?? { current_page: 1, last_page: 1, total: 0 });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load disputes.'));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  const loadSingleReport = useCallback(async (reportId) => {
    setDetailLoading(true);
    try {
      const res = await adminService.getReportById(reportId);
      setSelectedReport(res.data ?? res);
    } catch (err) {
      showToast('Failed to load dispute details.', 'error');
    } finally {
      setDetailLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (id) {
      loadSingleReport(id);
    } else {
      setSelectedReport(null);
      loadData();
    }
  }, [id, loadSingleReport, loadData]);

  const handleViewReport = (report) => {
    navigate(`/admin/reports/${report.id}`);
  };

  const handleDismissReport = async (report) => {
    try {
      await adminService.dismissReport(report.id);
      loadData();
    } catch {
      // non-critical
    }
  };

  // ── Show detail view ───────────────────────────────────────────────────
  if (detailLoading && !selectedReport) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (selectedReport) {
    return (
      <DisputeDetail
        report={selectedReport}
        onBack={() => {
          setSelectedReport(null);
          if (id) {
            navigate('/admin/reports');
          } else {
            loadData();
          }
        }}
        onRefresh={async () => {
          try {
            const res = await adminService.getReportById(selectedReport.id);
            setSelectedReport(res.data ?? res);
          } catch { /* ignore */ }
        }}
      />
    );
  }

  // ── Show list view ─────────────────────────────────────────────────────
  return (
    <div className="space-y-7">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Disputes</h1>
        <p className="text-sm text-gray-500">
          Review disputes, communicate with both parties, and resolve by releasing or refunding funds.
        </p>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
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

      {/* ── Reports List ────────────────────────────────────────────────── */}
      {error ? (
        <ErrorState title="Unable to load disputes" description={error} onRetry={loadData} />
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-card border border-gray-200 bg-white" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No disputes"
          description={statusFilter ? `No ${statusFilter} disputes found.` : 'No disputes found.'}
        />
      ) : (
        <>
          <div className="space-y-3">
            {reports.map((report) => (
              <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewReport(report)}>
                <CardBody>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-amber-500 shrink-0" />
                        <p className="text-sm font-bold text-ink-900">
                          Dispute #{report.id} — {report.reason || 'No reason'}
                        </p>
                        <Badge tone={STATUS_BADGE[report.status] || 'neutral'} size="xs">
                          {report.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {report.description || report.reason || 'No description provided.'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {report.reporter?.name ?? 'Unknown'}
                        </span>
                        <span>{formatDate(report.created_at ?? report.createdAt)}</span>
                        <span>Target: {report.target_type ?? 'Unknown'} #{report.target_id ?? '—'}</span>
                        {report.resolution_type && report.resolution_type !== 'pending' && (
                          <Badge tone={report.resolution_type === 'release_to_freelancer' ? 'success' : 'danger'} size="xs">
                            {report.resolution_type === 'release_to_freelancer' ? '→ Freelancer' : '→ Employer'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {report.status === 'pending' && (
                      <div className="flex shrink-0 gap-2" onClick={(e) => e.stopPropagation()}>
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

          {/* ── Pagination ────────────────────────────────────────────────── */}
          {meta.last_page > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {meta.current_page} of {meta.last_page}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={meta.current_page <= 1}
                  onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
