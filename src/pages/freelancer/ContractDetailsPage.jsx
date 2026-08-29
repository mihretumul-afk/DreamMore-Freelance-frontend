import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Play, Send, ChevronDown, ChevronRight, FileText, AlertCircle,
  CheckCircle2, Clock, Circle, Loader2, Banknote, User, Calendar, Sparkles,
  RotateCcw, Wallet, ExternalLink, Upload, Trash2, Download,
} from 'lucide-react';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { contractService } from '../../services/contractService';
import { formatDate, formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';
import { API_BASE_URL } from '../../config/env';
import { getAuthenticatedFileUrl } from '../../utils/fileUrl';

/* ─── Status Maps ────────────────────────────────────────────────────────── */

const CONTRACT_STATUS = {
  pending_acceptance: { tone: 'warning', label: 'Pending Acceptance' },
  active:            { tone: 'success', label: 'Active' },
  completed:         { tone: 'success', label: 'Completed' },
  cancelled:         { tone: 'danger',  label: 'Cancelled' },
  disputed:          { tone: 'danger',  label: 'Disputed' },
};

const MILESTONE_STEPS = ['draft', 'funded', 'in_progress', 'submitted', 'approved', 'released'];

const MILESTONE_STATUS = {
  draft:              { tone: 'neutral',  label: 'Draft',              icon: Circle,        bg: 'bg-gray-100',     text: 'text-gray-500' },
  unfunded:           { tone: 'neutral',  label: 'Awaiting Funding',  icon: Clock,         bg: 'bg-gray-100',     text: 'text-gray-500' },
  funded:             { tone: 'info',     label: 'Ready to Start',    icon: Play,          bg: 'bg-blue-100',     text: 'text-blue-600' },
  in_progress:        { tone: 'info',     label: 'In Progress',       icon: Loader2,       bg: 'bg-indigo-100',   text: 'text-indigo-600' },
  submitted:          { tone: 'warning',  label: 'Submitted',         icon: Send,          bg: 'bg-amber-100',    text: 'text-amber-600' },
  in_review:          { tone: 'warning',  label: 'In Review',         icon: Send,          bg: 'bg-amber-100',    text: 'text-amber-600' },
  revision_requested: { tone: 'danger',   label: 'Needs Revision',    icon: RotateCcw,     bg: 'bg-red-100',      text: 'text-red-600' },
  approved:           { tone: 'success',  label: 'Approved',          icon: CheckCircle2,  bg: 'bg-emerald-100',  text: 'text-emerald-600' },
  released:           { tone: 'success',  label: 'Paid',              icon: Sparkles,      bg: 'bg-emerald-100',  text: 'text-emerald-600' },
  disputed:           { tone: 'danger',   label: 'Disputed',          icon: AlertCircle,   bg: 'bg-red-100',      text: 'text-red-600' },
};

/* ─── Progress Bar ───────────────────────────────────────────────────────── */

function MilestoneProgress({ status }) {
  const currentIdx = MILESTONE_STEPS.indexOf(status);
  const isComplete = status === 'released' || status === 'approved';

  return (
    <div className="flex items-center gap-1 w-full px-1">
      {MILESTONE_STEPS.map((step, i) => {
        const isDone = i < currentIdx || isComplete;
        const isActive = i === currentIdx;
        return (
          <div key={step} className="flex items-center flex-1">
            <div className={`h-1.5 flex-1 rounded-full transition-all ${
              isDone ? 'bg-emerald-400' : isActive ? 'bg-brand-400' : 'bg-gray-200'
            }`} />
          </div>
        );
      })}
    </div>
  );
}

/* ─── Milestone Card ─────────────────────────────────────────────────────── */

function MilestoneCard({ milestone, onAction, actionLoading, onDeleteSubmissionFile }) {
  const status = MILESTONE_STATUS[milestone.status] ?? MILESTONE_STATUS.draft;
  const StatusIcon = status.icon;
  const [expanded, setExpanded] = useState(false);

  const canStart = milestone.status === 'funded';
  const canSubmit = milestone.status === 'in_progress' || milestone.status === 'revision_requested';
  const isComplete = milestone.status === 'released' || milestone.status === 'approved';
  const isWaiting = milestone.status === 'draft' || milestone.status === 'unfunded';
  const isSubmitted = milestone.status === 'submitted' || milestone.status === 'in_review';

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
      isComplete ? 'border-emerald-200 bg-emerald-50/30' :
      isWaiting ? 'border-gray-200 bg-gray-50/50' :
      'border-gray-200 bg-white hover:shadow-md'
    }`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left cursor-pointer"
      >
        {/* Status Icon */}
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${status.bg} ${status.text}`}>
          <StatusIcon className={`h-5 w-5 ${milestone.status === 'in_progress' ? 'animate-spin' : ''}`} />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`font-semibold truncate ${isComplete ? 'text-emerald-800' : 'text-ink-900'}`}>
              {milestone.title}
            </h4>
            {isComplete && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span className="font-semibold text-ink-700">{formatETB(milestone.amount)}</span>
            {milestone.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Due {formatDate(milestone.due_date)}
              </span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <Badge tone={status.tone} size="xs">{status.label}</Badge>

        {/* Chevron */}
        {expanded
          ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
          : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
        }
      </button>

      {/* Progress Bar */}
      <div className="px-5 pb-3">
        <MilestoneProgress status={milestone.status} />
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          {/* Status Info Banner */}
          {canStart && (
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-200 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                <Play className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800">Ready to Start!</p>
                <p className="text-xs text-blue-600">The employer has funded this milestone. Click below to begin working.</p>
              </div>
            </div>
          )}
          {canSubmit && (
            <div className="flex items-center gap-3 rounded-xl bg-indigo-50 border border-indigo-200 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
                <Send className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-800">
                  {milestone.status === 'revision_requested' ? 'Revision Needed' : 'Work in Progress'}
                </p>
                <p className="text-xs text-indigo-600">
                  {milestone.status === 'revision_requested'
                    ? 'The employer requested changes. Submit your revised work when ready.'
                    : 'When you\'re done, submit your work for review.'}
                </p>
              </div>
            </div>
          )}
          {isSubmitted && (
            <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">Awaiting Review</p>
                <p className="text-xs text-amber-600">Your work has been submitted. The employer will review and approve it.</p>
              </div>
            </div>
          )}
          {isComplete && (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                <Sparkles className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  {milestone.status === 'released' ? 'Payment Received! 🎉' : 'Work Approved!'}
                </p>
                <p className="text-xs text-emerald-600">
                  {milestone.status === 'released'
                    ? 'Funds have been released to your wallet. You can withdraw them anytime.'
                    : 'The employer approved your work. Funds will be released shortly.'}
                </p>
              </div>
            </div>
          )}
          {isWaiting && (
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Waiting for Funding</p>
                <p className="text-xs text-gray-500">The employer needs to fund this milestone before you can start working.</p>
              </div>
            </div>
          )}

          {/* Description & Deliverables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {milestone.description && (
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">{milestone.description}</p>
              </div>
            )}
            {milestone.deliverables && (
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Deliverables</p>
                <p className="text-sm text-gray-700 leading-relaxed">{milestone.deliverables}</p>
              </div>
            )}
          </div>

          {/* Milestone Reference Files from Employer */}
          {milestone.attachments && milestone.attachments.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Reference Files from Employer</p>
              <div className="space-y-1">
                {milestone.attachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-brand-500 shrink-0" />
                      <span className="text-xs font-medium text-ink-900 truncate">{file.name}</span>
                      <span className="text-[10px] text-gray-400">({file.formatted_size || (file.size / 1024 / 1024).toFixed(1) + ' MB'})</span>
                    </div>
                    <a href={getAuthenticatedFileUrl(file.path, 'attachment')} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-green-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-600 transition-colors">
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revision Note */}
          {milestone.status === 'revision_requested' && milestone.submissions?.length > 0 && milestone.submissions[0]?.revision_note && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-[10px] font-bold uppercase text-red-400 mb-1">Employer Feedback</p>
              <p className="text-sm text-red-700">{milestone.submissions[0].revision_note}</p>
            </div>
          )}

          {/* Submissions */}
          {milestone.submissions && milestone.submissions.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Your Submissions</p>
              <div className="space-y-2">
                {milestone.submissions.map((sub) => (
                  <div key={sub.id} className="rounded-xl border border-gray-100 bg-white p-3">
                    <p className="text-sm text-gray-700">{sub.description || 'No description'}</p>
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
                    {sub.files && sub.files.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {sub.files.map((file, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 text-brand-500 shrink-0" />
                              <span className="text-xs font-medium text-ink-900 truncate">{file.name}</span>
                              <span className="text-[10px] text-gray-400">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <a href={getAuthenticatedFileUrl(file.path, 'submission')} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg bg-green-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-600 transition-colors">
                                <Download className="h-3.5 w-3.5" /> Download
                              </a>
                              <button type="button" onClick={() => onDeleteSubmissionFile?.(milestone.contract_id, milestone.id, sub.id, file.path)}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </button>
                            </div>
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
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {canStart && (
              <Button variant="primary" size="sm" loading={actionLoading} onClick={() => onAction('start', milestone)}>
                <Play className="h-4 w-4" /> Start Working
              </Button>
            )}
            {canSubmit && (
              <Button variant="primary" size="sm" onClick={() => onAction('submit', milestone)}>
                <Send className="h-4 w-4" /> Submit Work
              </Button>
            )}
            {isComplete && milestone.status === 'released' && (
              <Link to="/freelancer/withdrawals">
                <Button variant="success" size="sm">
                  <Wallet className="h-4 w-4" /> Withdraw Funds
                </Button>
              </Link>
            )}
            {!canStart && !canSubmit && !isComplete && !isSubmitted && !isWaiting && (
              <p className="text-xs text-gray-400 italic">Waiting for the next step…</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function FreelancerContractDetailsPage() {
  const { id } = useParams();
  usePageTitle('Contract Details — Freelancer');
  const { showToast } = useToast();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitModal, setSubmitModal] = useState(null);
  const [submitDesc, setSubmitDesc] = useState('');
  const [submitLinks, setSubmitLinks] = useState('');
  const [submitFiles, setSubmitFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [acceptModal, setAcceptModal] = useState(false);
  const [declineModal, setDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await contractService.getContract(id);
      setContract(res.data ?? res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load contract.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleAcceptContract = async () => {
    setActionLoading(true);
    try {
      await contractService.acceptContract(id);
      showToast('Contract accepted! Check milestones to start working.', 'success');
      setAcceptModal(false);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to accept contract.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineContract = async () => {
    setActionLoading(true);
    try {
      await contractService.declineContract(id, declineReason);
      showToast('Contract declined.', 'success');
      setDeclineModal(false);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to decline.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = async (action, milestone) => {
    if (action === 'start') {
      setActionLoading(true);
      try {
        await contractService.startWork(id, milestone.id);
        showToast('Work started! Good luck! 🚀', 'success');
        load();
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to start work.', 'error');
      } finally {
        setActionLoading(false);
      }
    } else if (action === 'submit') {
      setSubmitModal(milestone);
      setSubmitDesc('');
      setSubmitLinks('');
      setSubmitFiles([]);
    }
  };

  const handleSubmitWork = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (submitDesc) formData.append('description', submitDesc);
      const links = submitLinks.split('\n').map((l) => l.trim()).filter(Boolean);
      links.forEach((link) => formData.append('links[]', link));
      submitFiles.forEach((file) => formData.append('files[]', file));

      await contractService.submitWork(id, submitModal.id, formData);

      showToast('Work submitted! The employer will review it.', 'success');
      setSubmitModal(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to submit work.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading / Error ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 rounded-xl bg-gray-200" />
        <div className="h-24 rounded-2xl bg-gray-100" />
        <div className="h-48 rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (error || !contract) {
    return <ErrorState title="Failed to load contract" description={error} onRetry={load} />;
  }

  const cs = CONTRACT_STATUS[contract.status] ?? { tone: 'neutral', label: contract.status };
  const isPending = contract.status === 'pending_acceptance';

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link to="/freelancer/contracts"
          className="rounded-xl p-2.5 text-gray-400 hover:bg-gray-100 hover:text-ink-900 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 truncate">{contract.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{contract.job?.title}</p>
        </div>
        <Badge tone={cs.tone}>{cs.label}</Badge>
      </div>

      {/* ── Pending Acceptance Banner ──────────────────────────────────── */}
      {isPending && (
        <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-amber-900">New Contract Offer</p>
                <p className="text-sm text-amber-700 mt-1">Review the terms and accept to start working on milestones.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeclineModal(true)}>Decline</Button>
              <Button variant="success" size="sm" loading={actionLoading} onClick={() => setAcceptModal(true)}>
                Accept Contract
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Contract Info Bar ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Employer</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="h-7 w-7 rounded-full bg-brand-100 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-brand-600" />
              </div>
              <p className="text-sm font-semibold text-ink-900">{contract.employer?.name || '—'}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Budget</p>
            <p className="text-xl font-extrabold text-ink-900 mt-1">{formatETB(contract.total_amount)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Type</p>
            <p className="text-sm font-medium text-ink-800 mt-1.5 capitalize">{contract.budget_type || 'Fixed'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Start Date</p>
            <p className="text-sm font-medium text-ink-800 mt-1.5">{contract.start_date ? formatDate(contract.start_date) : 'Not started'}</p>
          </div>
        </div>
      </div>

      {/* ── Milestones ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-ink-900">Milestones</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {contract.milestones?.length || 0} milestone{(contract.milestones?.length || 0) !== 1 ? 's' : ''}
              {' '}· Start funded milestones, then submit your work
            </p>
          </div>
        </div>

        {!contract.milestones || contract.milestones.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={FileText}
                title="No milestones yet"
                description={isPending ? 'Accept the contract to see milestones.' : 'The employer will create milestones for this contract.'}
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {contract.milestones.map((m) => (
              <MilestoneCard key={m.id} milestone={m} onAction={handleAction} actionLoading={actionLoading} />
            ))}
          </div>
        )}
      </div>

      {/* ── Accept Contract Modal ──────────────────────────────────────── */}
      <Modal open={acceptModal} onClose={() => setAcceptModal(false)} title="Accept Contract" size="sm">
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
            <p className="mt-2 text-sm font-semibold text-emerald-800">Ready to start working?</p>
            <p className="text-xs text-emerald-600 mt-1">By accepting, you agree to the contract terms.</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAcceptModal(false)}>Cancel</Button>
            <Button variant="success" loading={actionLoading} onClick={handleAcceptContract}>
              <CheckCircle2 className="h-4 w-4" /> Accept Contract
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Decline Modal ──────────────────────────────────────────────── */}
      <Modal open={declineModal} onClose={() => setDeclineModal(false)} title="Decline Contract" size="sm">
        <div className="space-y-4">
          <Textarea
            label="Reason (optional)"
            placeholder="Why are you declining?"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeclineModal(false)}>Cancel</Button>
            <Button variant="danger" loading={actionLoading} onClick={handleDeclineContract}>
              Decline Contract
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Submit Work Modal ──────────────────────────────────────────── */}
      <Modal open={Boolean(submitModal)} onClose={() => setSubmitModal(null)} title="Submit Work" size="md">
        <div className="space-y-4">
          <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 text-center">
            <Send className="mx-auto h-8 w-8 text-brand-500" />
            <p className="mt-2 text-sm font-semibold text-brand-800">Submitting: {submitModal?.title}</p>
            <p className="text-xs text-brand-600 mt-1">Describe your work and add any relevant links.</p>
          </div>

          <Textarea
            label="What did you complete?"
            placeholder="Describe the work you've done for this milestone..."
            value={submitDesc}
            onChange={(e) => setSubmitDesc(e.target.value)}
            rows={4}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">Deliverable Links (one per line)</label>
            <textarea
              value={submitLinks}
              onChange={(e) => setSubmitLinks(e.target.value)}
              placeholder="https://github.com/your-repo&#10;https://figma.com/your-design&#10;https://drive.google.com/..."
              rows={3}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-ink-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <p className="mt-1 text-[11px] text-gray-400">Add links to your code, designs, or any deliverables.</p>
          </div>

          {/* File Upload */}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">Upload Work Files</label>
            <div className="relative rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 text-center hover:border-brand-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt,.csv"
                onChange={(e) => setSubmitFiles([...submitFiles, ...Array.from(e.target.files)])}
                className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-ink-900">Drag & drop or <span className="text-brand-600 underline">browse</span></p>
              <p className="mt-1 text-xs text-gray-500">Photos, Videos, Audio, Documents — Max 400MB each</p>
            </div>
            {submitFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {submitFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-brand-500 shrink-0" />
                      <span className="text-xs font-medium text-ink-900 truncate">{file.name}</span>
                      <span className="text-[10px] text-gray-400">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                    </div>
                    <button type="button" onClick={() => setSubmitFiles(submitFiles.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setSubmitModal(null)}>Cancel</Button>
            <Button variant="primary" loading={submitting} onClick={handleSubmitWork}>
              <Send className="h-4 w-4" /> Submit Work
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
