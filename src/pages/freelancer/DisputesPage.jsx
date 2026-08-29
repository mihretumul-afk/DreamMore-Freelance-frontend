import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Flag, ArrowLeft, MessageSquare, User, FileText,
  ExternalLink, Download, Send, CheckCircle2, AlertCircle, Clock,
  ChevronLeft, ChevronRight, ShieldAlert,
} from 'lucide-react';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { disputeService } from '../../services/disputeService';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../config/env';
import { getAuthenticatedFileUrl } from '../../utils/fileUrl';

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

function RoleBadge({ role, isSelf }) {
  if (isSelf) {
    return <Badge tone="brand" size="xs">You</Badge>;
  }
  if (role === 'admin') {
    return <Badge tone="danger" size="xs">Admin</Badge>;
  }
  if (role === 'employer') {
    return <Badge tone="warning" size="xs">Employer</Badge>;
  }
  return <Badge tone="info" size="xs">Freelancer</Badge>;
}

export default function FreelancerDisputesPage() {
  usePageTitle('Disputes — Freelancer');
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Detail view state
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [sendingNote, setSendingNote] = useState(false);

  // Load disputes list
  const loadDisputes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      const res = await disputeService.getDisputes(params);
      const payload = res.data ?? res;
      setDisputes(Array.isArray(payload) ? payload : (payload.data ?? []));
      setMeta(res.meta ?? payload.meta ?? { current_page: 1, last_page: 1, total: 0 });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load disputes.'));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  // Load single dispute detail
  const loadDisputeDetail = useCallback(async (disputeId) => {
    setDetailLoading(true);
    try {
      const res = await disputeService.getDispute(disputeId);
      setSelectedDispute(res.data ?? res);
    } catch (err) {
      showToast('Failed to load dispute details.', 'error');
      navigate('/freelancer/disputes');
    } finally {
      setDetailLoading(false);
    }
  }, [navigate, showToast]);

  useEffect(() => {
    if (id) {
      loadDisputeDetail(id);
    } else {
      setSelectedDispute(null);
      loadDisputes();
    }
  }, [id, loadDisputes, loadDisputeDetail]);

  // Send note / reply
  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedDispute) return;
    setSendingNote(true);
    try {
      await disputeService.addNote(selectedDispute.id, noteText.trim());
      showToast('Message sent successfully.', 'success');
      setNoteText('');
      loadDisputeDetail(selectedDispute.id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send message.', 'error');
    } finally {
      setSendingNote(false);
    }
  };

  // ── Detail View ────────────────────────────────────────────────────────
  if (id || selectedDispute) {
    if (detailLoading && !selectedDispute) {
      return (
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-40 animate-pulse rounded-card border border-gray-200 bg-white" />
        </div>
      );
    }

    if (!selectedDispute) return null;

    const milestone = selectedDispute.milestone;
    const contract  = selectedDispute.contract;
    const submissions = milestone?.submissions ?? [];
    const notesList = selectedDispute.notes_list ?? [];

    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/freelancer/disputes')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-ink-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all disputes
        </button>

        {/* ── Dispute Header ─────────────────────────────────────────── */}
        <Card>
          <CardBody>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                <Flag className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-ink-900">Dispute #{selectedDispute.id}</h1>
                  <Badge tone={STATUS_BADGE[selectedDispute.status] || 'neutral'} size="sm">
                    {selectedDispute.status}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-gray-700 mt-1">Reason: {selectedDispute.reason}</p>
                {selectedDispute.description && (
                  <p className="text-sm text-gray-500 mt-1">{selectedDispute.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Filed by {selectedDispute.reporter?.name ?? 'Employer'} · {formatDate(selectedDispute.created_at)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* ── Contract & Milestone Info ──────────────────────────────── */}
        {milestone && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardBody>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Contract</p>
                <p className="text-sm font-semibold text-ink-900">{contract?.title || '—'}</p>
                <p className="text-xs text-gray-500 mt-1">Status: {contract?.status || '—'}</p>
                {contract?.employer && (
                  <div className="flex items-center gap-2 mt-2">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-600">Employer: {contract.employer.name}</span>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Milestone</p>
                <p className="text-sm font-semibold text-ink-900">{milestone.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Amount: <span className="font-semibold text-ink-900">{formatETB(milestone.amount)}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Status:{' '}
                  <Badge tone={milestone.status === 'disputed' ? 'danger' : 'warning'} size="xs">
                    {MILESTONE_STATUS_LABEL[milestone.status] || milestone.status}
                  </Badge>
                </p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* ── Submissions ────────────────────────────────────────────── */}
        {submissions.length > 0 && (
          <Card>
            <CardBody>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                Your Submitted Deliverables
              </p>
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div key={sub.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-sm text-gray-700">{sub.description || 'No description'}</p>

                    {sub.links && sub.links.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {sub.links.map((link, i) => (
                          <a
                            key={i}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs text-brand-600 hover:bg-brand-100 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" /> Link {i + 1}
                          </a>
                        ))}
                      </div>
                    )}

                    {sub.files && sub.files.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] font-bold uppercase text-gray-400">Files</p>
                        {sub.files.map((file, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 text-brand-500 shrink-0" />
                              <span className="text-xs font-medium text-ink-900 truncate">{file.name}</span>
                            </div>
                            <a
                              href={getAuthenticatedFileUrl(file.path, 'submission')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded p-1 text-brand-600 hover:bg-brand-50 transition-colors"
                            >
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

        {/* ── Communication Timeline ──────────────────────────────────── */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4 text-gray-400" />
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Dispute Communications & Notes
              </p>
            </div>

            {notesList.length > 0 ? (
              <div className="space-y-3 mb-6">
                {notesList.map((item) => {
                  const isSelf = item.sender_id === user?.id;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl p-4 border ${
                        isSelf
                          ? 'bg-brand-50/60 border-brand-200 text-brand-950'
                          : item.sender_role === 'admin'
                          ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                          : 'bg-gray-50 border-gray-200 text-ink-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{item.sender_name || 'System'}</span>
                          <RoleBadge role={item.sender_role} isSelf={isSelf} />
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {item.created_at ? formatDate(item.created_at) : ''}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{item.note}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-6 text-center">
                <p className="text-xs text-gray-400 italic">No notes yet. Send a message to communicate with the administrator.</p>
              </div>
            )}

            {/* Reply form */}
            {selectedDispute.status === 'pending' ? (
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <Textarea
                  placeholder="Type your response to the administrator..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button variant="primary" size="sm" loading={sendingNote} onClick={handleAddNote} disabled={!noteText.trim()}>
                    <Send className="h-3.5 w-3.5" /> Send Message
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                <p className="text-xs font-semibold text-emerald-800">
                  This dispute has been resolved ({selectedDispute.status}).
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    );
  }

  // ── List View ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-7">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Contract Disputes</h1>
        <p className="text-sm text-gray-500">
          View active and resolved contract disputes and communicate directly with platform mediation.
        </p>
      </div>

      <Card>
        <CardBody>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </Select>
          </div>
        </CardBody>
      </Card>

      {error ? (
        <ErrorState title="Unable to load disputes" description={error} onRetry={loadDisputes} />
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-card border border-gray-200 bg-white" />
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No disputes"
          description={statusFilter ? `No ${statusFilter} disputes found.` : 'You have no active or historical disputes.'}
        />
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => (
            <Card
              key={dispute.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/freelancer/disputes/${dispute.id}`)}
            >
              <CardBody>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-amber-500 shrink-0" />
                      <p className="text-sm font-bold text-ink-900">
                        Dispute #{dispute.id} — {dispute.reason || 'Contract Dispute'}
                      </p>
                      <Badge tone={STATUS_BADGE[dispute.status] || 'neutral'} size="xs">
                        {dispute.status}
                      </Badge>
                    </div>
                    {dispute.contract && (
                      <p className="text-xs font-semibold text-gray-700">
                        Contract: {dispute.contract.title}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {dispute.description || dispute.reason}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Filed {formatDate(dispute.created_at)}
                    </p>
                  </div>
                  <Button variant="outline" size="xs">View Details</Button>
                </div>
              </CardBody>
            </Card>
          ))}

          {meta.last_page > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500">
                Page {meta.current_page} of {meta.last_page}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
