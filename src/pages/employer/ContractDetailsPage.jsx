import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, ChevronDown, ChevronRight, FileText, AlertCircle,
  ThumbsUp, RotateCcw, Flag, Wallet, CheckCircle2, Clock, Circle, Loader2,
  Banknote, User, Calendar, Sparkles, Send, Upload, Trash2, Download,
} from 'lucide-react';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { contractService } from '../../services/contractService';
import { financialService } from '../../services/financialService';
import { formatDate, formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';
import { API_BASE_URL } from '../../config/env';
import { getAuthenticatedFileUrl } from '../../utils/fileUrl';

/* ─── Status Maps ────────────────────────────────────────────────────────── */

const CONTRACT_STATUS = {
  pending_acceptance: { tone: 'warning', label: 'Pending Acceptance', color: 'amber' },
  active:            { tone: 'success', label: 'Active', color: 'emerald' },
  completed:         { tone: 'success', label: 'Completed', color: 'emerald' },
  cancelled:         { tone: 'danger',  label: 'Cancelled', color: 'red' },
  disputed:          { tone: 'danger',  label: 'Disputed', color: 'red' },
};

const MILESTONE_STEPS = ['draft', 'funded', 'in_progress', 'submitted', 'approved', 'released'];

const MILESTONE_STATUS = {
  draft:              { tone: 'neutral',  label: 'Draft',              icon: Circle,        color: 'gray',   bg: 'bg-gray-100',     text: 'text-gray-600',    ring: 'ring-gray-200' },
  unfunded:           { tone: 'neutral',  label: 'Ready',              icon: Circle,        color: 'gray',   bg: 'bg-gray-100',     text: 'text-gray-600',    ring: 'ring-gray-200' },
  funded:             { tone: 'info',     label: 'Funded',             icon: Banknote,      color: 'blue',   bg: 'bg-blue-100',     text: 'text-blue-600',    ring: 'ring-blue-200' },
  in_progress:        { tone: 'info',     label: 'In Progress',        icon: Loader2,       color: 'indigo', bg: 'bg-indigo-100',   text: 'text-indigo-600',  ring: 'ring-indigo-200' },
  submitted:          { tone: 'warning',  label: 'Submitted',          icon: Send,          color: 'amber',  bg: 'bg-amber-100',    text: 'text-amber-600',   ring: 'ring-amber-200' },
  in_review:          { tone: 'warning',  label: 'In Review',          icon: Send,          color: 'amber',  bg: 'bg-amber-100',    text: 'text-amber-600',   ring: 'ring-amber-200' },
  revision_requested: { tone: 'danger',   label: 'Revision Requested', icon: RotateCcw,     color: 'red',    bg: 'bg-red-100',      text: 'text-red-600',     ring: 'ring-red-200' },
  approved:           { tone: 'success',  label: 'Approved',           icon: CheckCircle2,  color: 'emerald',bg: 'bg-emerald-100',  text: 'text-emerald-600', ring: 'ring-emerald-200' },
  released:           { tone: 'success',  label: 'Completed',          icon: Sparkles,      color: 'emerald',bg: 'bg-emerald-100',  text: 'text-emerald-600', ring: 'ring-emerald-200' },
  disputed:           { tone: 'danger',   label: 'Disputed',           icon: Flag,          color: 'red',    bg: 'bg-red-100',      text: 'text-red-600',     ring: 'ring-red-200' },
};

/* ─── Progress Steps ─────────────────────────────────────────────────────── */

function MilestoneProgress({ status }) {
  const currentIdx = MILESTONE_STEPS.indexOf(status);
  const isComplete = status === 'released' || status === 'approved';

  return (
    <div className="flex items-center gap-1 w-full px-1">
      {MILESTONE_STEPS.map((step, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx || isComplete;
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

function MilestoneCard({ milestone, onAction }) {
  const status = MILESTONE_STATUS[milestone.status] ?? MILESTONE_STATUS.draft;
  const StatusIcon = status.icon;
  const [expanded, setExpanded] = useState(false);

  const canReview = milestone.status === 'submitted' || milestone.status === 'in_review';
  const canFund = milestone.status === 'draft' || milestone.status === 'unfunded';
  const isComplete = milestone.status === 'released' || milestone.status === 'approved';

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
      isComplete ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-white hover:shadow-md'
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
      <div className="px-5 pb-2">
        <MilestoneProgress status={milestone.status} />
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          {/* Description & Deliverables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Milestone Reference Files */}
          {milestone.attachments && milestone.attachments.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Reference Files</p>
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

          {/* Submissions */}
          {milestone.submissions && milestone.submissions.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Submissions</p>
              <div className="space-y-2">
                {milestone.submissions.map((sub) => (
                  <div key={sub.id} className="rounded-xl border border-gray-100 bg-white p-3">
                    <p className="text-sm text-gray-700">{sub.description || 'No description'}</p>

                    {/* Links */}
                    {sub.links && sub.links.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {sub.links.map((link, i) => (
                          <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs text-brand-600 hover:bg-brand-100 transition-colors">
                            🔗 Link {i + 1}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Files */}
                    {sub.files && sub.files.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] font-bold uppercase text-gray-400">Uploaded Files</p>
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
            {canFund && (
              <Button variant="primary" size="sm" onClick={() => onAction('fund', milestone)}>
                <Wallet className="h-4 w-4" /> Fund This Milestone
              </Button>
            )}
            {canReview && (
              <>
                <Button variant="success" size="sm" onClick={() => onAction('approve', milestone)}>
                  <ThumbsUp className="h-4 w-4" /> Approve & Release Funds
                </Button>
                <Button variant="outline" size="sm" onClick={() => onAction('revision', milestone)}>
                  <RotateCcw className="h-4 w-4" /> Request Revision
                </Button>
                <Button variant="danger" size="sm" onClick={() => onAction('dispute', milestone)}>
                  <Flag className="h-4 w-4" /> Dispute
                </Button>
              </>
            )}
            {!canFund && !canReview && !isComplete && (
              <p className="text-xs text-gray-400 italic">No actions available — waiting for the other party.</p>
            )}
            {isComplete && (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> This milestone is complete.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Summary Stats ──────────────────────────────────────────────────────── */

function SummaryStats({ milestones }) {
  if (!milestones || milestones.length === 0) return null;

  const total = milestones.length;
  const completed = milestones.filter(m => m.status === 'released' || m.status === 'approved').length;
  const inProgress = milestones.filter(m => ['funded', 'in_progress', 'submitted', 'in_review'].includes(m.status)).length;
  const pending = milestones.filter(m => m.status === 'draft').length;
  const totalAmount = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  const fundedAmount = milestones.filter(m => m.status !== 'draft').reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold text-gray-400">Total</p>
        <p className="text-2xl font-extrabold text-ink-900 mt-1">{total}</p>
      </div>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs font-semibold text-emerald-600">Completed</p>
        <p className="text-2xl font-extrabold text-emerald-700 mt-1">{completed}</p>
      </div>
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs font-semibold text-blue-600">Active</p>
        <p className="text-2xl font-extrabold text-blue-700 mt-1">{inProgress}</p>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-semibold text-amber-600">Pending Fund</p>
        <p className="text-2xl font-extrabold text-amber-700 mt-1">{pending}</p>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function EmployerContractDetailsPage() {
  const { id } = useParams();
  usePageTitle('Contract Details — Employer');
  const { showToast } = useToast();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Create milestone
  const [createModal, setCreateModal] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', deliverables: '', amount: '', due_date: '' });
  const [milestoneFiles, setMilestoneFiles] = useState([]);
  const [creating, setCreating] = useState(false);

  // Revision
  const [revisionModal, setRevisionModal] = useState(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [revisionLoading, setRevisionLoading] = useState(false);

  // Dispute
  const [disputeModal, setDisputeModal] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);

  // Fund
  const [fundModal, setFundModal] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [funding, setFunding] = useState(false);

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

  const loadPaymentMethods = async () => {
    try {
      const res = await financialService.getPaymentMethods();
      setPaymentMethods(res.data ?? []);
    } catch (err) {
      showToast('Failed to load payment methods.', 'error');
    }
  };

  const handleCreateMilestone = async () => {
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('title', milestoneForm.title);
      if (milestoneForm.description) formData.append('description', milestoneForm.description);
      if (milestoneForm.deliverables) formData.append('deliverables', milestoneForm.deliverables);
      formData.append('amount', parseFloat(milestoneForm.amount));
      if (milestoneForm.due_date) formData.append('due_date', milestoneForm.due_date);
      milestoneFiles.forEach((file) => formData.append('files[]', file));

      await contractService.createMilestone(id, formData);
      showToast('Milestone created! Now fund it to let the freelancer start.', 'success');
      setCreateModal(false);
      setMilestoneForm({ title: '', description: '', deliverables: '', amount: '', due_date: '' });
      setMilestoneFiles([]);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create milestone.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleAction = async (action, milestone) => {
    if (action === 'fund') {
      setFundModal(milestone);
      setSelectedMethod('');
      loadPaymentMethods();
    } else if (action === 'approve') {
      setActionLoading(true);
      try {
        await contractService.approveMilestone(id, milestone.id);
        showToast('Work approved! Funds released to freelancer.', 'success');
        load();
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to approve.', 'error');
      } finally {
        setActionLoading(false);
      }
    } else if (action === 'revision') {
      setRevisionModal(milestone);
      setRevisionNote('');
    } else if (action === 'dispute') {
      setDisputeModal(milestone);
      setDisputeReason('');
    }
  };

  const handleFundMilestone = async () => {
    if (!selectedMethod) {
      showToast('Please select a payment method.', 'error');
      return;
    }
    setFunding(true);
    try {
      const res = await financialService.fundMilestone(fundModal.id, parseInt(selectedMethod));
      showToast(res?.message || 'Milestone funded successfully! Freelancer can now start working.', 'success');
      setFundModal(null);
      setSelectedMethod('');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fund milestone.', 'error');
    } finally {
      setFunding(false);
    }
  };

  const handleRevision = async () => {
    setRevisionLoading(true);
    try {
      await contractService.requestRevision(id, revisionModal.id, revisionNote);
      showToast('Revision requested.', 'success');
      setRevisionModal(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to request revision.', 'error');
    } finally {
      setRevisionLoading(false);
    }
  };

  const handleDispute = async () => {
    setDisputeLoading(true);
    try {
      await contractService.openDispute(id, disputeModal.id, disputeReason);
      showToast('Dispute opened. An admin will review.', 'success');
      setDisputeModal(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to open dispute.', 'error');
    } finally {
      setDisputeLoading(false);
    }
  };

  /* ── Loading / Error ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 rounded-xl bg-gray-200" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-xl bg-gray-100" />)}
        </div>
        <div className="h-48 rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (error || !contract) {
    return <ErrorState title="Failed to load contract" description={error} onRetry={load} />;
  }

  const cs = CONTRACT_STATUS[contract.status] ?? { tone: 'neutral', label: contract.status };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link to="/employer/contracts"
          className="rounded-xl p-2.5 text-gray-400 hover:bg-gray-100 hover:text-ink-900 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 truncate">{contract.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{contract.job?.title}</p>
        </div>
        <Badge tone={cs.tone}>{cs.label}</Badge>
      </div>

      {/* ── Contract Info Bar ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Freelancer</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="h-7 w-7 rounded-full bg-brand-100 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-brand-600" />
              </div>
              <p className="text-sm font-semibold text-ink-900">{contract.freelancer?.name || '—'}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Budget</p>
            <p className="text-xl font-extrabold text-ink-900 mt-1">{formatETB(contract.total_amount)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Start Date</p>
            <p className="text-sm font-medium text-ink-800 mt-1.5">{contract.start_date ? formatDate(contract.start_date) : 'Not started'}</p>
          </div>
          {contract.end_date && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">End Date</p>
              <p className="text-sm font-medium text-ink-800 mt-1.5">{formatDate(contract.end_date)}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Summary Stats ──────────────────────────────────────────────── */}
      <SummaryStats milestones={contract.milestones} />

      {/* ── Milestones Section ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-ink-900">Milestones</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {contract.milestones?.length || 0} milestone{(contract.milestones?.length || 0) !== 1 ? 's' : ''} · Fund each milestone before the freelancer can start
            </p>
          </div>
          {contract.status === 'active' && (
            <Button variant="primary" size="sm" onClick={() => setCreateModal(true)}>
              <Plus className="h-4 w-4" /> New Milestone
            </Button>
          )}
        </div>

        {!contract.milestones || contract.milestones.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={FileText}
                title="No milestones yet"
                description="Create milestones to break the contract into fundable deliverables."
                action={
                  contract.status === 'active' ? (
                    <Button variant="primary" size="sm" onClick={() => setCreateModal(true)}>
                      <Plus className="h-4 w-4" /> Create First Milestone
                    </Button>
                  ) : null
                }
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {contract.milestones.map((m) => (
              <MilestoneCard key={m.id} milestone={m} onAction={handleAction} />
            ))}
          </div>
        )}
      </div>

      {/* ── Create Milestone Modal ─────────────────────────────────────── */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Milestone" size="md">
        <div className="space-y-4">
          <Input label="Title" placeholder="e.g., Design Homepage" value={milestoneForm.title}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} required />
          <Textarea label="Description" placeholder="Describe the work to be done..."
            value={milestoneForm.description} onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })} rows={3} />
          <Textarea label="Deliverables" placeholder="What should be delivered?"
            value={milestoneForm.deliverables} onChange={(e) => setMilestoneForm({ ...milestoneForm, deliverables: e.target.value })} rows={2} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount (ETB)" type="number" step="0.01" min="0" placeholder="0.00"
              value={milestoneForm.amount} onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: e.target.value })} required />
            <Input label="Due Date" type="date" value={milestoneForm.due_date}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })} />
          </div>

          {/* File Upload — Reference Files */}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">Reference Files (optional)</label>
            <div className="relative rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 text-center hover:border-brand-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt,.csv"
                onChange={(e) => setMilestoneFiles([...milestoneFiles, ...Array.from(e.target.files)])}
                className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-ink-900">Drag & drop or <span className="text-brand-600 underline">browse</span></p>
              <p className="mt-1 text-xs text-gray-500">Photos, Videos, Documents — Max 200MB each</p>
            </div>
            {milestoneFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {milestoneFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-brand-500 shrink-0" />
                      <span className="text-xs font-medium text-ink-900 truncate">{file.name}</span>
                      <span className="text-[10px] text-gray-400">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                    </div>
                    <button type="button" onClick={() => setMilestoneFiles(milestoneFiles.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1 text-[11px] text-gray-400">Photos, videos, audio, documents — up to 200MB per file.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button variant="primary" loading={creating} onClick={handleCreateMilestone}>
              <Plus className="h-4 w-4" /> Create Milestone
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Fund Milestone Modal ───────────────────────────────────────── */}
      <Modal open={Boolean(fundModal)} onClose={() => setFundModal(null)} title="Fund Milestone" size="md">
        <div className="space-y-4">
          <div className="rounded-xl bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-100 p-5 text-center">
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Milestone Amount</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-600">{formatETB(fundModal?.amount || 0)}</p>
            <p className="mt-1 text-sm text-gray-500">{fundModal?.title}</p>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              The amount will be held in escrow. Once the freelancer completes the work and you approve it, the funds will be released to them.
            </p>
          </div>

          {paymentMethods.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center">
              <Wallet className="mx-auto h-10 w-10 text-amber-400" />
              <p className="mt-3 text-sm font-semibold text-amber-800">No Payment Methods</p>
              <p className="mt-1 text-xs text-amber-600">Add a payment method to fund milestones.</p>
              <Link to="/employer/payment-methods">
                <Button variant="outline" size="sm" className="mt-3">Add Payment Method →</Button>
              </Link>
            </div>
          ) : (
            <Select label="Payment Method" value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)}>
              <option value="">Select a payment method</option>
              {paymentMethods.map((m) => (
                <option key={m.id} value={m.id}>{m.display_label || m.nickname || `Method #${m.id}`}</option>
              ))}
            </Select>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setFundModal(null)}>Cancel</Button>
            <Button variant="primary" loading={funding} onClick={handleFundMilestone} disabled={!selectedMethod || paymentMethods.length === 0}>
              <Banknote className="h-4 w-4" /> Fund {formatETB(fundModal?.amount || 0)}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Revision Modal ─────────────────────────────────────────────── */}
      <Modal open={Boolean(revisionModal)} onClose={() => setRevisionModal(null)} title="Request Revision" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            What needs to be changed for <strong className="text-ink-900">{revisionModal?.title}</strong>?
          </p>
          <Textarea label="Feedback" placeholder="Explain what needs to be revised..."
            value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)} rows={4} required />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRevisionModal(null)}>Cancel</Button>
            <Button variant="primary" loading={revisionLoading} onClick={handleRevision}>
              <RotateCcw className="h-4 w-4" /> Send Revision
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Dispute Modal ──────────────────────────────────────────────── */}
      <Modal open={Boolean(disputeModal)} onClose={() => setDisputeModal(null)} title="Open Dispute" size="md">
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Escalate to Admin</p>
                <p className="text-xs text-amber-600 mt-1">This will pause the milestone and an administrator will review the dispute.</p>
              </div>
            </div>
          </div>
          <Textarea label="Reason" placeholder="Describe the issue..."
            value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} rows={4} required />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDisputeModal(null)}>Cancel</Button>
            <Button variant="danger" loading={disputeLoading} onClick={handleDispute}>
              <Flag className="h-4 w-4" /> Open Dispute
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
