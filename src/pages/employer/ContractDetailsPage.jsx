import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  MapPin,
  MessageSquare,
  PauseCircle,
  PlayCircle,
  Star,
  TrendingUp,
  Users,
  Wallet,
  BarChart3,
  Activity,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { ContractDetailSkeleton } from '../../components/contracts/ContractSkeleton';
import ContractHeader from '../../components/contracts/ContractHeader';
import MilestoneList from '../../components/contracts/MilestoneList';
import MilestoneForm from '../../components/contracts/MilestoneForm';
import RequestRevisionModal from '../../components/contracts/RequestRevisionModal';
import ConfirmActionModal from '../../components/proposals/ConfirmActionModal';
import FundMilestoneModal from '../../components/payments/FundMilestoneModal';
import RequestRefundModal from '../../components/payments/RequestRefundModal';
import ReviewForm from '../../components/ui/ReviewForm';
import ReviewList from '../../components/ui/ReviewList';
import Avatar from '../../components/marketplace/Avatar';
import StatusBadge from '../../components/marketplace/StatusBadge';
import { contractService } from '../../services/contractService';
import { milestoneService } from '../../services/milestoneService';
import paymentService from '../../services/paymentService';
import { reviewService } from '../../services/reviewService';
import { normalizeContract } from '../../utils/contractMapper';
import { milestoneFormToPayload } from '../../utils/milestoneMapper';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { formatDate, formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';
import { useRealtimeContract } from '../../hooks/useRealtimeContract';
import { cn } from '../../utils/cn';
import ActivityLog from '../../components/contracts/ActivityLog';

/* ──────────────────────────────────────────────────────────────────────
   Tab Configuration
   ────────────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'milestones', label: 'Milestones', icon: BarChart3 },
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
];

/* ──────────────────────────────────────────────────────────────────────
   Dialog Configuration
   ────────────────────────────────────────────────────────────────────── */
const CONTRACT_DIALOGS = {
  pause: {
    title: 'Pause contract?',
    description:
      'Pausing stops milestone work on this contract. You can resume it at any time.',
    confirmLabel: 'Pause Contract',
    tone: 'primary',
    icon: PauseCircle,
  },
  resume: {
    title: 'Resume contract?',
    description: 'Resuming makes the contract active again so milestones can be managed and submitted.',
    confirmLabel: 'Resume Contract',
    tone: 'success',
    icon: PlayCircle,
  },
  complete: {
    title: 'Complete contract?',
    description:
      'All milestones must be approved before a contract can be completed. Completion ends the contract and sets its end date.',
    confirmLabel: 'Complete Contract',
    tone: 'success',
    icon: CheckCircle2,
  },
  cancel: {
    title: 'Cancel contract?',
    description: 'Cancelling ends the contract. This is permanent and cannot be undone.',
    confirmLabel: 'Cancel Contract',
    tone: 'danger',
    icon: Ban,
  },
};

const MILESTONE_DIALOGS = {
  approve: {
    title: 'Approve milestone deliverable?',
    description:
      "Approving confirms the freelancer's submitted work for this milestone. If all milestones on this contract are approved, the contract and job will automatically complete.",
    confirmLabel: 'Approve Deliverable',
    tone: 'success',
  },
  delete: {
    title: 'Delete milestone?',
    description:
      'Only milestones that have not started yet can be deleted. This cannot be undone.',
    confirmLabel: 'Delete Milestone',
    tone: 'danger',
  },
};

/* ──────────────────────────────────────────────────────────────────────
   Status Timeline Step
   ────────────────────────────────────────────────────────────────────── */
function TimelineStep({ label, active, completed, date, icon: Icon }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
          completed
            ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
            : active
              ? 'border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/30 animate-pulse'
              : 'border-gray-200 bg-gray-50 text-gray-400',
        )}
      >
        {completed ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : Icon ? (
          <Icon className="h-5 w-5" />
        ) : (
          <span className="text-sm font-bold">{label.charAt(0)}</span>
        )}
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            'text-sm font-semibold',
            active || completed ? 'text-ink-900' : 'text-gray-400',
          )}
        >
          {label}
        </p>
        {date && <p className="text-xs text-gray-400">{formatDate(date)}</p>}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Quick Stat Card
   ────────────────────────────────────────────────────────────────────── */
function QuickStat({ icon: Icon, label, value, color, trend }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <TrendingUp className="h-3 w-3" /> {trend}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-extrabold text-ink-900">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
   ────────────────────────────────────────────────────────────────────── */
export default function EmployerContractDetailsPage() {
  usePageTitle('Contract Details');
  const { id } = useParams();
  const navigate = useNavigate();

  // Core state
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [activeTab, setActiveTab] = useState('milestones');

  // Contract-level actions
  const [contractAction, setContractAction] = useState(null);
  const [milestoneAction, setMilestoneAction] = useState(null);
  const [revisionMilestone, setRevisionMilestone] = useState(null);
  const [submittingRevision, setSubmittingRevision] = useState(false);
  const [revisionFieldErrors, setRevisionFieldErrors] = useState({});
  const [revisionGeneralError, setRevisionGeneralError] = useState(null);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Milestone form
  const [formOpen, setFormOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formFieldErrors, setFormFieldErrors] = useState({});
  const [formGeneralError, setFormGeneralError] = useState(null);

  const [notice, setNotice] = useState(null);
  const [contractReviews, setContractReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Payment modals
  const [fundMilestone, setFundMilestone] = useState(null);
  const [fundSubmitting, setFundSubmitting] = useState(false);
  const [fundError, setFundError] = useState(null);
  const [releaseMilestone, setReleaseMilestone] = useState(null);
  const [releaseSubmitting, setReleaseSubmitting] = useState(false);
  const [releaseError, setReleaseError] = useState(null);
  const [refundMilestone, setRefundMilestone] = useState(null);
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const { showToast } = useToast();

  // ── Real-time Updates ─────────────────────────────────────────────
  const currentUserId = contract?.employerId ?? null;
  const { connected, onContractUpdated, onMilestoneUpdated } = useRealtimeContract(currentUserId, id);

  // ── Data Loading ──────────────────────────────────────────────────
  const loadContract = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await contractService.getContract(id);
        if (res.success) {
          setContract(normalizeContract(res.data));
        } else {
          setError(res.message || 'Contract not found.');
          setNotFound(true);
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
          setNotFound(true);
          setError('This contract does not exist or is no longer available.');
        } else if (status === 403) {
          setForbidden(true);
          setError(err.response.data?.message || 'You do not have access to this contract.');
        } else {
          setError(getErrorMessage(err, 'Unable to load this contract. Please try again.'));
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  useEffect(() => {
    if (contract?.status === 'completed') {
      const loadReviews = async () => {
        try {
          const response = await reviewService.getUserReviews(contract.employer?.id);
          const reviews = response.data ?? [];
          setContractReviews(reviews.filter((r) => r.contract_id === contract.id));
        } catch {
          // non-critical
        }
      };
      loadReviews();
    }
  }, [contract?.status, contract?.employer?.id, contract?.id]);

  // ── Real-time Update Listeners ──────────────────────────────────────
  useEffect(() => {
    const unsubscribeContract = onContractUpdated((data) => {
      // Refresh contract data when status changes
      loadContract(true);
      showToast(`Contract ${data.update_type === 'status_change' ? 'status' : 'details'} updated`, 'info');
    });

    const unsubscribeMilestone = onMilestoneUpdated((data) => {
      // Refresh contract data when milestone changes
      loadContract(true);
      const actionLabels = {
        milestone_created: 'New milestone added',
        milestone_funded: 'Milestone funded',
        milestone_started: 'Freelancer started work',
        milestone_submitted: 'Work submitted for review',
        milestone_approved: 'Milestone approved',
        milestone_revision_requested: 'Revision requested',
        milestone_updated: 'Milestone updated',
      };
      const label = actionLabels[data.update_type] || 'Milestone updated';
      showToast(label, 'info');
    });

    return () => {
      unsubscribeContract();
      unsubscribeMilestone();
    };
  }, [onContractUpdated, onMilestoneUpdated, loadContract, showToast]);

  // ── Contract Actions ──────────────────────────────────────────────
  const openContractAction = (kind) => {
    setActionError(null);
    setContractAction(kind);
  };

  const handleContractAction = async () => {
    if (!contractAction) return;
    setActing(true);
    setActionError(null);
    try {
      const call = {
        pause: contractService.pauseContract,
        resume: contractService.resumeContract,
        complete: contractService.completeContract,
        cancel: contractService.cancelContract,
      }[contractAction];
      const res = await call(contract.id);
      setNotice(res.message || 'Contract updated.');
      setContractAction(null);
      await loadContract(true);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to update this contract. Please try again.'));
      setActing(false);
    }
  };

  // ── Milestone Actions ─────────────────────────────────────────────
  const openMilestoneAction = (milestone, kind) => {
    if (kind === 'revision') {
      setRevisionFieldErrors({});
      setRevisionGeneralError(null);
      setRevisionMilestone(milestone);
      return;
    }
    setActionError(null);
    setMilestoneAction({ milestone, kind });
  };

  const handleMilestoneAction = async () => {
    if (!milestoneAction) return;
    const { milestone, kind } = milestoneAction;
    setActing(true);
    setActionError(null);
    try {
      const call =
        kind === 'approve'
          ? milestoneService.approveMilestone
          : milestoneService.deleteMilestone;
      const res = await call(contract.id, milestone.id);
      setNotice(res.message || 'Milestone updated.');
      setMilestoneAction(null);
      await loadContract(true);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to update this milestone. Please try again.'));
      setActing(false);
    }
  };

  const handleRevisionSubmit = async (payload) => {
    if (!revisionMilestone) return;
    setSubmittingRevision(true);
    setRevisionFieldErrors({});
    setRevisionGeneralError(null);
    try {
      const res = await milestoneService.requestMilestoneRevision(contract.id, revisionMilestone.id, payload);
      setNotice(res.message || 'Revision requested successfully.');
      setRevisionMilestone(null);
      await loadContract(true);
    } catch (err) {
      setRevisionFieldErrors(getFieldErrors(err));
      setRevisionGeneralError(getErrorMessage(err, 'Unable to request revision. Please try again.'));
    } finally {
      setSubmittingRevision(false);
    }
  };

  const openCreateForm = () => {
    setEditingMilestone(null);
    setFormFieldErrors({});
    setFormGeneralError(null);
    setFormSubmitting(false);
    setFormOpen(true);
  };

  const openEditForm = (milestone) => {
    setEditingMilestone(milestone);
    setFormFieldErrors({});
    setFormGeneralError(null);
    setFormSubmitting(false);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingMilestone(null);
    setFormFieldErrors({});
    setFormGeneralError(null);
    setFormSubmitting(false);
  };

  // ── Payment Actions ──────────────────────────────────────────────
  const handleFundMilestone = async () => {
    if (!fundMilestone) return;
    setFundSubmitting(true);
    setFundError(null);
    try {
      const defaultMethod = paymentMethods.find(m => m.is_default) || paymentMethods[0];
      const payload = defaultMethod ? { payment_method_id: defaultMethod.id } : {};
      const res = await paymentService.fundMilestone(contract.id, fundMilestone.id, payload);
      setNotice(res.message || 'Milestone funded successfully.');
      setFundMilestone(null);
      await loadContract(true);
    } catch (err) {
      setFundError(getErrorMessage(err, 'Unable to fund milestone. Please try again.'));
    } finally {
      setFundSubmitting(false);
    }
  };

  const handleReleaseMilestone = async () => {
    if (!releaseMilestone) return;
    setReleaseSubmitting(true);
    setReleaseError(null);
    try {
      const res = await paymentService.releaseMilestone(contract.id, releaseMilestone.id);
      setNotice(res.message || 'Payment released to freelancer.');
      setReleaseMilestone(null);
      await loadContract(true);
    } catch (err) {
      setReleaseError(getErrorMessage(err, 'Unable to release payment. Please try again.'));
    } finally {
      setReleaseSubmitting(false);
    }
  };

  const handleRefundRequest = async (payload) => {
    if (!refundMilestone) return;
    setRefundSubmitting(true);
    setRefundError(null);
    try {
      const res = await paymentService.requestMilestoneRefund(contract.id, refundMilestone.id, payload);
      setNotice(res.message || 'Refund request submitted.');
      setRefundMilestone(null);
      await loadContract(true);
    } catch (err) {
      setRefundError(getErrorMessage(err, 'Unable to submit refund request. Please try again.'));
    } finally {
      setRefundSubmitting(false);
    }
  };

  useEffect(() => {
    if (fundMilestone) {
      paymentService.getPaymentMethods()
        .then(res => setPaymentMethods(res.data ?? res ?? []))
        .catch(() => setPaymentMethods([]));
    }
  }, [fundMilestone]);

  const handleFormSubmit = async (form) => {
    setFormSubmitting(true);
    setFormFieldErrors({});
    setFormGeneralError(null);
    try {
      const payload = milestoneFormToPayload(form);
      if (editingMilestone) {
        const res = await milestoneService.updateMilestone(contract.id, editingMilestone.id, payload);
        setNotice(res.message || 'Milestone updated.');
      } else {
        const res = await milestoneService.createMilestone(contract.id, payload);
        setNotice(res.message || 'Milestone created.');
      }
      setFormOpen(false);
      setFormSubmitting(false);
      setEditingMilestone(null);
      await loadContract(true);
    } catch (err) {
      setFormFieldErrors(getFieldErrors(err));
      const hasFieldErrors = Object.keys(getFieldErrors(err)).length > 0;
      setFormGeneralError(
        hasFieldErrors ? null : getErrorMessage(err, 'Unable to save this milestone. Please try again.'),
      );
      setFormSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────
  if (loading) return <ContractDetailSkeleton />;

  if (error || !contract) {
    return (
      <ErrorState
        title={notFound ? 'Contract not found' : forbidden ? 'Access denied' : 'Unable to load this contract'}
        description={error}
        onRetry={loadContract}
      />
    );
  }

  const job = contract.job;
  const contractActive = contract.status === 'active';
  const contractPaused = contract.status === 'paused';
  const contractCompleted = contract.status === 'completed';
  const canAddMilestone = contractActive;
  const summary = contract.summary || {};
  const progressPercent = summary.progressPercent ?? 0;

  const initialFormValues = editingMilestone
    ? {
        title: editingMilestone.title ?? '',
        description: editingMilestone.description ?? '',
        amount: editingMilestone.amount != null ? String(editingMilestone.amount) : '',
        dueDate: editingMilestone.dueDate ? editingMilestone.dueDate.slice(0, 10) : '',
      }
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 border-b border-gray-100">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb & Back */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link to="/employer/contracts" className="hover:text-ink-900 transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> My Contracts
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-ink-900 font-medium truncate max-w-[200px]">{contract.title}</span>
          </div>

          {/* Contract Header */}
          <ContractHeader contract={contract} role="employer" />

          {/* Quick Stats Row */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickStat
              icon={BarChart3}
              label="Progress"
              value={`${progressPercent}%`}
              color="bg-brand-500"
              trend={progressPercent > 0 ? `${summary.completedMilestonesCount ?? 0}/${summary.milestonesCount ?? 0}` : null}
            />
            <QuickStat
              icon={Wallet}
              label="Total Budget"
              value={formatETB(contract.totalAmount)}
              color="bg-emerald-500"
            />
            <QuickStat
              icon={TrendingUp}
              label="Completed"
              value={summary.completedMilestonesCount ?? 0}
              color="bg-indigo-500"
            />
            <QuickStat
              icon={Users}
              label="Milestones"
              value={summary.milestonesCount ?? 0}
              color="bg-amber-500"
            />
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-4 pb-12">
        {/* Notice Banner */}
        {notice && (
          <div className="mb-6" role="status">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <p className="text-sm font-medium text-emerald-700">{notice}</p>
              <button onClick={() => setNotice(null)} className="ml-auto text-emerald-500 hover:text-emerald-700">
                <span className="sr-only">Dismiss</span>
                ×
              </button>
            </div>
          </div>
        )}

        {/* Real-time Connection Status */}
        <div className="mb-4 flex items-center justify-end gap-2 text-xs text-gray-400">
          <div className={cn(
            'h-2 w-2 rounded-full',
            connected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300',
          )} />
          <span>{connected ? 'Live updates active' : 'Connecting...'}</span>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
          <nav className="flex gap-1" role="tablist">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-ink-900',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
          {/* Main Content Area */}
          <div className="min-w-0 space-y-6">
            {/* ── Milestones Tab ── */}
            {activeTab === 'milestones' && (
              <div className="space-y-6">
                <MilestoneList
                  contract={contract}
                  role="employer"
                  busyAction={milestoneAction?.milestone.id ?? null}
                  canAdd={canAddMilestone}
                  onAddMilestone={openCreateForm}
                  onMilestoneAction={(milestone, kind) => {
                    if (kind === 'edit') {
                      openEditForm(milestone);
                    } else if (kind === 'fund') {
                      navigate(`/employer/contracts/${contract.id}/milestones/${milestone.id}/checkout`);
                    } else if (kind === 'release') {
                      setReleaseMilestone(milestone);
                      setReleaseError(null);
                    } else if (kind === 'refund') {
                      setRefundMilestone(milestone);
                      setRefundError(null);
                    } else {
                      openMilestoneAction(milestone, kind);
                    }
                  }}
                />
              </div>
            )}

            {/* ── Overview Tab ── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Job Information */}
                <Card className="rounded-2xl overflow-hidden">
                  <CardHeader
                    title="Job Details"
                    description="The original job posting linked to this contract"
                    action={
                      job && (
                        <Badge tone="info" size="md">
                          #{job.id}
                        </Badge>
                      )
                    }
                  />
                  <CardBody>
                    {job ? (
                      <div className="space-y-4">
                        <Link
                          to={`/employer/jobs/${job.id}`}
                          className="group inline-flex items-center gap-2 text-lg font-bold text-ink-900 transition-colors hover:text-brand-600"
                        >
                          {job.title}
                          <span className="text-brand-500 transition-transform group-hover:translate-x-1">→</span>
                        </Link>

                        <div className="flex flex-wrap gap-3">
                          {job.minBudget != null && job.maxBudget != null && (
                            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                              <Wallet className="h-3.5 w-3.5" />
                              Budget {formatETB(job.minBudget)} – {formatETB(job.maxBudget)}
                            </div>
                          )}
                          {job.locationType && (
                            <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                              <MapPin className="h-3.5 w-3.5" />
                              {job.locationType === 'remote' ? 'Remote' : job.location || job.locationType}
                            </div>
                          )}
                          {job.deadline && (
                            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                              <CalendarDays className="h-3.5 w-3.5" />
                              Deadline {formatDate(job.deadline)}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Job information is no longer available.</p>
                    )}
                  </CardBody>
                </Card>

                {/* Contract Timeline */}
                <Card className="rounded-2xl overflow-hidden">
                  <CardHeader
                    title="Contract Timeline"
                    description="Key milestones and dates for this contract"
                  />
                  <CardBody>
                    <div className="space-y-0">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/30">
                            <PlayCircle className="h-5 w-5" />
                          </div>
                          <div className="h-full w-0.5 bg-gray-200 my-1" />
                        </div>
                        <div className="pb-6">
                          <p className="text-sm font-bold text-ink-900">Contract Started</p>
                          <p className="text-xs text-gray-500">{formatDate(contract.startDate)}</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg",
                            contractActive ? "bg-emerald-500 shadow-emerald-500/30" : "bg-gray-300"
                          )}>
                            <Activity className="h-5 w-5" />
                          </div>
                          <div className="h-full w-0.5 bg-gray-200 my-1" />
                        </div>
                        <div className="pb-6">
                          <p className="text-sm font-bold text-ink-900">Milestones In Progress</p>
                          <p className="text-xs text-gray-500">
                            {summary.milestonesCount ?? 0} milestones · {summary.completedMilestonesCount ?? 0} completed
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg",
                            contractCompleted ? "bg-emerald-500 shadow-emerald-500/30" : "bg-gray-300"
                          )}>
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-ink-900">Contract Completed</p>
                          <p className="text-xs text-gray-500">
                            {contract.endDate ? formatDate(contract.endDate) : 'Pending completion'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Participants */}
                <Card className="rounded-2xl overflow-hidden">
                  <CardHeader
                    title="Participants"
                    description="People involved in this contract"
                  />
                  <CardBody>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Employer */}
                      <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <Avatar name={contract.employer?.name ?? 'Employer'} src={contract.employer?.avatar} size="lg" variant="brand" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Employer (You)</p>
                          <p className="text-sm font-bold text-ink-900 truncate">{contract.employer?.name ?? '—'}</p>
                          {contract.employer?.email && (
                            <p className="text-xs text-gray-500 truncate">{contract.employer.email}</p>
                          )}
                        </div>
                      </div>

                      {/* Freelancer */}
                      <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <Avatar name={contract.freelancer?.name ?? 'Freelancer'} src={contract.freelancer?.avatar} size="lg" variant="success" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Freelancer</p>
                          <p className="text-sm font-bold text-ink-900 truncate">{contract.freelancer?.name ?? '—'}</p>
                          {contract.freelancer?.email && (
                            <p className="text-xs text-gray-500 truncate">{contract.freelancer.email}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {/* ── Activity Tab ── */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <Card className="rounded-2xl overflow-hidden">
                  <CardHeader
                    title="Activity Log"
                    description="Timeline of all events on this contract"
                  />
                  <CardBody>
                    <ActivityLog contractId={contract.id} />
                  </CardBody>
                </Card>
              </div>
            )}

            {/* ── Reviews Tab ── */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {contractCompleted ? (
                  <Card className="rounded-2xl overflow-hidden">
                    <CardHeader
                      title="Reviews & Feedback"
                      description="Client and freelancer feedback for this contract"
                      action={
                        !showReviewForm && !reviewSubmitted ? (
                          <Button
                            size="sm"
                            onClick={() => setShowReviewForm(true)}
                          >
                            <Star className="h-4 w-4" /> Leave a Review
                          </Button>
                        ) : null
                      }
                    />
                    <CardBody>
                      {contractReviews.length > 0 ? (
                        <ReviewList reviews={contractReviews} />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                            <Star className="h-8 w-8 text-gray-300" />
                          </div>
                          <p className="mt-4 text-sm font-medium text-gray-500">No reviews have been submitted yet.</p>
                        </div>
                      )}

                      {showReviewForm && !reviewSubmitted && (
                        <div className="mt-6 border-t border-gray-100 pt-6">
                          <h4 className="mb-4 text-sm font-semibold text-ink-900">
                            Write a Review for {contract.freelancer?.name ?? 'the freelancer'}
                          </h4>
                          <ReviewForm
                            contractId={contract.id}
                            onSuccess={() => {
                              setShowReviewForm(false);
                              setReviewSubmitted(true);
                              loadContract(true);
                            }}
                            onCancel={() => setShowReviewForm(false)}
                          />
                        </div>
                      )}
                    </CardBody>
                  </Card>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 px-6 py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <MessageSquare className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-ink-900">Reviews available after completion</h3>
                    <p className="mt-1 max-w-sm text-sm text-gray-500">
                      Once this contract is completed, you can leave a review for the freelancer.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-5 lg:sticky lg:top-8">
            {/* Contract Status Card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-ink-900">Contract Status</h3>
                <StatusBadge status={contract.status} size="md" dot />
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-gray-500">Progress</span>
                  <span className="text-brand-600">{progressPercent}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-500 transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  {summary.completedMilestonesCount ?? 0} of {summary.milestonesCount ?? 0} completed
                </p>
              </div>

              {/* Financial Summary */}
              <div className="space-y-2.5 rounded-xl bg-gray-50 p-3.5 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Total Budget</span>
                  <span className="font-bold text-ink-900">{formatETB(contract.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Completed</span>
                  <span className="font-bold text-emerald-600">{formatETB(summary.completedMilestoneAmount || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Remaining</span>
                  <span className="font-bold text-amber-600">{formatETB(summary.remainingMilestoneAmount || contract.totalAmount)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              {(contractActive || contractPaused) && (
                <div className="space-y-2">
                  {contractActive && (
                    <>
                      <Button
                        variant="success"
                        className="w-full"
                        size="sm"
                        onClick={() => openContractAction('complete')}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Complete Contract
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        size="sm"
                        onClick={() => openContractAction('pause')}
                      >
                        <PauseCircle className="h-4 w-4" /> Pause Contract
                      </Button>
                    </>
                  )}
                  {contractPaused && (
                    <Button
                      variant="success"
                      className="w-full"
                      size="sm"
                      onClick={() => openContractAction('resume')}
                    >
                      <PlayCircle className="h-4 w-4" /> Resume Contract
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    className="w-full"
                    size="sm"
                    onClick={() => openContractAction('cancel')}
                  >
                    <Ban className="h-4 w-4" /> Cancel Contract
                  </Button>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="space-y-2">
                <Link
                  to="/employer/contracts"
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-ink-900"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Contracts
                </Link>
                <Link
                  to="/employer/jobs"
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-ink-900"
                >
                  <ClipboardList className="h-4 w-4" /> Manage Jobs
                </Link>
              </div>
            </div>

            {/* Escrow Guarantee */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                  <Wallet className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-900">Escrow Protected</p>
                  <p className="mt-0.5 text-[11px] text-blue-700">
                    Funds are held safely in escrow until milestones are approved and released.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Modals ── */}
      <ConfirmActionModal
        open={Boolean(contractAction)}
        onClose={() => setContractAction(null)}
        title={contractAction ? CONTRACT_DIALOGS[contractAction].title : ''}
        description={contractAction ? CONTRACT_DIALOGS[contractAction].description : ''}
        confirmLabel={contractAction ? CONTRACT_DIALOGS[contractAction].confirmLabel : ''}
        tone={contractAction ? CONTRACT_DIALOGS[contractAction].tone : 'primary'}
        busy={acting}
        error={actionError}
        onConfirm={handleContractAction}
      />

      <ConfirmActionModal
        open={Boolean(milestoneAction)}
        onClose={() => setMilestoneAction(null)}
        title={milestoneAction ? MILESTONE_DIALOGS[milestoneAction.kind]?.title ?? '' : ''}
        description={milestoneAction ? MILESTONE_DIALOGS[milestoneAction.kind]?.description ?? '' : ''}
        confirmLabel={milestoneAction ? MILESTONE_DIALOGS[milestoneAction.kind]?.confirmLabel ?? '' : ''}
        tone={milestoneAction ? MILESTONE_DIALOGS[milestoneAction.kind]?.tone ?? 'primary' : 'primary'}
        busy={acting}
        error={actionError}
        onConfirm={handleMilestoneAction}
      />

      <RequestRevisionModal
        open={Boolean(revisionMilestone)}
        onClose={() => setRevisionMilestone(null)}
        milestone={revisionMilestone}
        submitting={submittingRevision}
        fieldErrors={revisionFieldErrors}
        generalError={revisionGeneralError}
        onSubmit={handleRevisionSubmit}
      />

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingMilestone ? 'Edit Milestone' : 'Add Milestone'}
        description={
          editingMilestone
            ? 'Only pending or in-progress milestones can be edited on an active contract.'
            : 'Break the work into paid checkpoints on this active contract.'
        }
        size="md"
      >
        {editingMilestone ? (
          <MilestoneForm
            key={editingMilestone.id}
            initialValues={initialFormValues}
            submitLabel="Save Changes"
            submitting={formSubmitting}
            fieldErrors={formFieldErrors}
            generalError={formGeneralError}
            onSubmit={handleFormSubmit}
            onCancel={closeForm}
          />
        ) : (
          <MilestoneForm
            submitting={formSubmitting}
            fieldErrors={formFieldErrors}
            generalError={formGeneralError}
            onSubmit={handleFormSubmit}
            onCancel={closeForm}
          />
        )}
      </Modal>

      <FundMilestoneModal
        open={Boolean(fundMilestone)}
        onClose={() => { setFundMilestone(null); setFundError(null); }}
        milestone={fundMilestone}
        paymentMethod={paymentMethods.find(m => m.is_default) || paymentMethods[0]}
        submitting={fundSubmitting}
        error={fundError}
        onConfirm={handleFundMilestone}
      />

      <ConfirmActionModal
        open={Boolean(releaseMilestone)}
        onClose={() => { setReleaseMilestone(null); setReleaseError(null); }}
        title="Release payment to freelancer?"
        description={releaseMilestone ? `Approve and release ${formatETB(releaseMilestone.amount)} to the freelancer for milestone "${releaseMilestone.title}". This action cannot be undone.` : ''}
        confirmLabel="Release Payment"
        tone="success"
        busy={releaseSubmitting}
        error={releaseError}
        onConfirm={handleReleaseMilestone}
      />

      <RequestRefundModal
        open={Boolean(refundMilestone)}
        onClose={() => { setRefundMilestone(null); setRefundError(null); }}
        milestone={refundMilestone}
        payment={refundMilestone ? { amount: refundMilestone.amount, reference: fundMilestone?.payment?.reference } : null}
        submitting={refundSubmitting}
        error={refundError}
        onConfirm={handleRefundRequest}
      />
    </div>
  );
}
