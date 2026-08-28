import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Star,
  TrendingUp,
  Wallet,
  BarChart3,
  Activity,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { ContractDetailSkeleton } from '../../components/contracts/ContractSkeleton';
import ContractHeader from '../../components/contracts/ContractHeader';
import MilestoneList from '../../components/contracts/MilestoneList';
import SubmitWorkModal from '../../components/contracts/SubmitWorkModal';
import ReviewForm from '../../components/ui/ReviewForm';
import ReviewList from '../../components/ui/ReviewList';
import Avatar from '../../components/marketplace/Avatar';
import StatusBadge from '../../components/marketplace/StatusBadge';
import { contractService } from '../../services/contractService';
import { milestoneService } from '../../services/milestoneService';
import { reviewService } from '../../services/reviewService';
import { normalizeContract } from '../../utils/contractMapper';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { formatETB, formatCurrency } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useRealtimeContract } from '../../hooks/useRealtimeContract';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../utils/cn';
import ActivityLog from '../../components/contracts/ActivityLog';

/* ──────────────────────────────────────────────────────────────────────
   Tab Configuration
   ────────────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'milestones', label: 'Milestones', icon: BarChart3 },
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
];

/* ──────────────────────────────────────────────────────────────────────
   Quick Stat Card
   ────────────────────────────────────────────────────────────────────── */
function QuickStat({ icon: Icon, label, value, color }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-extrabold text-ink-900">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
   ────────────────────────────────────────────────────────────────────── */
export default function FreelancerContractDetailsPage() {
  usePageTitle('Contract Details');
  const { id } = useParams();

  // Core state
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [activeTab, setActiveTab] = useState('milestones');

  // Submit deliverable work modal
  const [submittingMilestone, setSubmittingMilestone] = useState(null);
  const [submittingWork, setSubmittingWork] = useState(false);
  const [submitFieldErrors, setSubmitFieldErrors] = useState({});
  const [submitGeneralError, setSubmitGeneralError] = useState(null);

  const [notice, setNotice] = useState(null);
  const [contractReviews, setContractReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Earnings summary
  const [earnings, setEarnings] = useState(null);

  const [startingMilestone, setStartingMilestone] = useState(null);

  const { showToast } = useToast();

  // ── Real-time Updates ─────────────────────────────────────────────
  const currentUserId = contract?.freelancerId ?? null;
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

  // Load reviews for completed contracts
  useEffect(() => {
    if (contract?.status === 'completed') {
      const loadReviews = async () => {
        try {
          const response = await reviewService.getUserReviews(contract.freelancer?.id);
          const reviews = response.data ?? [];
          setContractReviews(reviews.filter((r) => r.contract_id === contract.id));
        } catch {
          // non-critical
        }
      };
      loadReviews();
    }
  }, [contract?.status, contract?.freelancer?.id, contract?.id]);

  // Load earnings summary
  useEffect(() => {
    if (contract?.milestones?.length > 0) {
      import('../../services/paymentService').then(({ default: ps }) => {
        ps.getMilestoneEarnings()
          .then((res) => {
            const data = res.data ?? res ?? [];
            const contractMilestones = data.filter(m => m.contract_id === contract.id);
            const totalAmount = contractMilestones.reduce((sum, m) => sum + m.amount, 0);
            const totalFees = contractMilestones.reduce((sum, m) => sum + m.total_fee, 0);
            const totalNet = contractMilestones.reduce((sum, m) => sum + m.net_amount, 0);
            const released = contractMilestones.filter(m => m.is_released);
            const pending = contractMilestones.filter(m => m.is_funded && !m.is_released);
            setEarnings({
              totalAmount,
              totalFees,
              totalNet,
              releasedCount: released.length,
              pendingCount: pending.length,
              releasedAmount: released.reduce((sum, m) => sum + m.net_amount, 0),
              pendingAmount: pending.reduce((sum, m) => sum + m.net_amount, 0),
              totalCount: contractMilestones.length,
            });
          })
          .catch(() => {});
      });
    }
  }, [contract?.id, contract?.milestones?.length]);

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
        milestone_created: 'New milestone added by employer',
        milestone_funded: 'Milestone funded — you can start working!',
        milestone_started: 'Work started on milestone',
        milestone_submitted: 'Work submitted for review',
        milestone_approved: 'Milestone approved!',
        milestone_revision_requested: 'Revision requested by employer',
        milestone_updated: 'Milestone updated',
      };
      const label = actionLabels[data.update_type] || 'Milestone updated';
      showToast(label, data.update_type === 'milestone_funded' ? 'success' : 'info');
    });

    return () => {
      unsubscribeContract();
      unsubscribeMilestone();
    };
  }, [onContractUpdated, onMilestoneUpdated, loadContract, showToast]);

  // ── Milestone Actions ─────────────────────────────────────────────
  const openMilestoneSubmit = (milestone) => {
    setSubmitFieldErrors({});
    setSubmitGeneralError(null);
    setSubmittingMilestone(milestone);
  };

  const handleStartWork = async (milestone) => {
    setStartingMilestone(milestone.id);
    try {
      const res = await milestoneService.startWork(contract.id, milestone.id);
      setNotice(res.message || 'Work started! You can now work on this milestone.');
      await loadContract(true);
    } catch (err) {
      setNotice(null);
      setError(getErrorMessage(err, 'Unable to start work. The milestone may not be funded yet.'));
    } finally {
      setStartingMilestone(null);
    }
  };

  const handleWorkSubmit = async (formData) => {
    if (!submittingMilestone) return;
    setSubmittingWork(true);
    setSubmitFieldErrors({});
    setSubmitGeneralError(null);
    try {
      const res = await milestoneService.submitMilestone(contract.id, submittingMilestone.id, formData);
      setNotice(res.message || 'Work submitted successfully.');
      setSubmittingMilestone(null);
      await loadContract(true);
    } catch (err) {
      setSubmitFieldErrors(getFieldErrors(err));
      setSubmitGeneralError(getErrorMessage(err, 'Unable to submit work. Please check the requirements and try again.'));
    } finally {
      setSubmittingWork(false);
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
  const contractCompleted = contract.status === 'completed';
  const summary = contract.summary || {};
  const progressPercent = summary.progressPercent ?? 0;

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
            <Link to="/freelancer/contracts" className="hover:text-ink-900 transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> My Contracts
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-ink-900 font-medium truncate max-w-[200px]">{contract.title}</span>
          </div>

          {/* Contract Header */}
          <ContractHeader contract={contract} role="freelancer" />

          {/* Quick Stats Row */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickStat
              icon={BarChart3}
              label="Progress"
              value={`${progressPercent}%`}
              color="bg-brand-500"
            />
            <QuickStat
              icon={Wallet}
              label="Contract Value"
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
              icon={Clock}
              label="Pending"
              value={(summary.milestonesCount ?? 0) - (summary.completedMilestonesCount ?? 0)}
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
                  role="freelancer"
                  canAdd={false}
                  busyAction={startingMilestone}
                  onMilestoneAction={(milestone, action) => {
                    if (action === 'submit') {
                      openMilestoneSubmit(milestone);
                    } else if (action === 'startWork') {
                      handleStartWork(milestone);
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
                        <p className="text-lg font-bold text-ink-900">{job.title}</p>
                        <div className="flex flex-wrap gap-3">
                          {job.minBudget != null && job.maxBudget != null && (
                            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                              <Wallet className="h-3.5 w-3.5" />
                              Budget {formatETB(job.minBudget)} – {formatETB(job.maxBudget)}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Job information unavailable.</p>
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
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <div className="h-full w-0.5 bg-gray-200 my-1" />
                        </div>
                        <div className="pb-6">
                          <p className="text-sm font-bold text-ink-900">Contract Accepted</p>
                          <p className="text-xs text-gray-500">
                            {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'N/A'}
                          </p>
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
                          <p className="text-sm font-bold text-ink-900">Work In Progress</p>
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
                            {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Pending completion'}
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
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Employer</p>
                          <p className="text-sm font-bold text-ink-900 truncate">{contract.employer?.name ?? '—'}</p>
                          {contract.employer?.email && (
                            <p className="text-xs text-gray-500 truncate">{contract.employer.email}</p>
                          )}
                        </div>
                      </div>

                      {/* Freelancer (You) */}
                      <div className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                        <Avatar name={contract.freelancer?.name ?? 'Freelancer'} src={contract.freelancer?.avatar} size="lg" variant="success" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Freelancer (You)</p>
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

            {/* ── Earnings Tab ── */}
            {activeTab === 'earnings' && (
              <div className="space-y-6">
                {earnings ? (
                  <>
                    {/* Earnings Summary Cards */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-xs font-medium text-gray-500">Total Value</span>
                        </div>
                        <p className="mt-2 text-xl font-bold text-ink-900">{formatETB(earnings.totalAmount)}</p>
                        <p className="text-[11px] text-gray-400">{earnings.totalCount} milestone{earnings.totalCount !== 1 ? 's' : ''}</p>
                      </div>

                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          </div>
                          <span className="text-xs font-medium text-emerald-600">Released</span>
                        </div>
                        <p className="mt-2 text-xl font-bold text-emerald-700">{formatETB(earnings.releasedAmount)}</p>
                        <p className="text-[11px] text-emerald-500">{earnings.releasedCount} milestone{earnings.releasedCount !== 1 ? 's' : ''}</p>
                      </div>

                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-xs font-medium text-blue-600">Pending</span>
                        </div>
                        <p className="mt-2 text-xl font-bold text-blue-700">{formatETB(earnings.pendingAmount)}</p>
                        <p className="text-[11px] text-blue-500">{earnings.pendingCount} milestone{earnings.pendingCount !== 1 ? 's' : ''}</p>
                      </div>

                      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                            <Wallet className="h-4 w-4 text-amber-600" />
                          </div>
                          <span className="text-xs font-medium text-amber-600">Fees</span>
                        </div>
                        <p className="mt-2 text-xl font-bold text-amber-700">{formatETB(earnings.totalFees)}</p>
                        <p className="text-[11px] text-amber-500">Platform + processing</p>
                      </div>
                    </div>

                    {/* Net Earnings */}
                    <Card className="rounded-2xl overflow-hidden">
                      <CardBody>
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                              <Wallet className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-ink-900">Net Earnings After Fees</p>
                              <p className="text-xs text-gray-500">Your actual take-home amount</p>
                            </div>
                          </div>
                          <p className="text-2xl font-extrabold text-emerald-600">{formatETB(earnings.totalNet)}</p>
                        </div>

                        <div className="mt-4">
                          <Link
                            to="/freelancer/payments"
                            className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                          >
                            View full transaction history →
                          </Link>
                        </div>
                      </CardBody>
                    </Card>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 px-6 py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <Wallet className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-ink-900">No earnings yet</h3>
                    <p className="mt-1 max-w-sm text-sm text-gray-500">
                      Earnings will appear here once you start working on funded milestones.
                    </p>
                  </div>
                )}
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
                            Write a Review for {contract.employer?.name ?? 'the client'}
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
                      Once this contract is completed, you can leave a review for the employer.
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
                  <span className="text-gray-500">Total Value</span>
                  <span className="font-bold text-ink-900">{formatETB(contract.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Earned</span>
                  <span className="font-bold text-emerald-600">{formatETB(summary.completedMilestoneAmount || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Remaining</span>
                  <span className="font-bold text-amber-600">{formatETB(summary.remainingMilestoneAmount || contract.totalAmount)}</span>
                </div>
              </div>

              {/* Navigation */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <Link
                  to="/freelancer/contracts"
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-ink-900"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to My Contracts
                </Link>
                <Link
                  to="/jobs"
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-ink-900"
                >
                  <Briefcase className="h-4 w-4" /> Find More Jobs
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
                    Funds are held safely until you submit work and it's approved.
                  </p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                  <Star className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">Pro Tip</p>
                  <p className="mt-0.5 text-[11px] text-amber-700">
                    Start work on funded milestones promptly to build trust and get faster payments.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Submit Work Modal ── */}
      <SubmitWorkModal
        open={Boolean(submittingMilestone)}
        onClose={() => setSubmittingMilestone(null)}
        milestone={submittingMilestone}
        submitting={submittingWork}
        fieldErrors={submitFieldErrors}
        generalError={submitGeneralError}
        onSubmit={handleWorkSubmit}
      />
    </div>
  );
}
