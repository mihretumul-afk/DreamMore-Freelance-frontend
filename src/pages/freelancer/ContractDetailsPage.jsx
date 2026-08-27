import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, CheckCircle2, Star, Wallet, TrendingUp, Clock } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import PageHeader from '../../components/marketplace/PageHeader';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ContractDetailSkeleton } from '../../components/contracts/ContractSkeleton';
import ContractHeader from '../../components/contracts/ContractHeader';
import ContractSummary from '../../components/contracts/ContractSummary';
import MilestoneList from '../../components/contracts/MilestoneList';
import SubmitWorkModal from '../../components/contracts/SubmitWorkModal';
import ReviewForm from '../../components/ui/ReviewForm';
import ReviewList from '../../components/ui/ReviewList';
import { contractService } from '../../services/contractService';
import { milestoneService } from '../../services/milestoneService';
import { reviewService } from '../../services/reviewService';
import { normalizeContract } from '../../utils/contractMapper';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { formatETB, formatCurrency } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function FreelancerContractDetailsPage() {
  usePageTitle('Contract Details');
  const { id } = useParams();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);

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
  const [earningsLoading, setEarningsLoading] = useState(false);

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

  const [startingMilestone, setStartingMilestone] = useState(null);

  // Load earnings summary for this contract
  useEffect(() => {
    if (contract?.milestones?.length > 0) {
      setEarningsLoading(true);
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
          .catch(() => {})
          .finally(() => setEarningsLoading(false));
      });
    }
  }, [contract?.id, contract?.milestones?.length]);

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
  const jobLinkable = job?.status === 'open';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Freelancer"
        title="Contract Details"
        breadcrumbs={[
          { label: 'My Contracts', to: '/freelancer/contracts' },
          { label: contract.title },
        ]}
      />

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm font-medium text-success-700"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {notice}
        </div>
      )}

      <ContractHeader contract={contract} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          {/* Job information */}
          <Card>
            <CardHeader title="Job" />
            <CardBody>
              {job ? (
                <>
                  {jobLinkable ? (
                    <Link
                      to={`/jobs/${job.id}`}
                      className="text-base font-bold text-ink-900 transition-colors hover:text-brand-600"
                    >
                      {job.title}
                    </Link>
                  ) : (
                    <p className="text-base font-bold text-ink-900">{job.title}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {job.minBudget != null && job.maxBudget != null
                      ? `Budget: ${formatETB(job.minBudget)} – ${formatETB(job.maxBudget)}`
                      : 'Fixed price job'}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">Job information unavailable.</p>
              )}
            </CardBody>
          </Card>

          {/* Milestones list with deliverable submission actions & history */}
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

          {/* Earnings Summary */}
          {earnings && (
            <Card>
              <CardHeader
                title="Earnings Summary"
                description="Payment status for this contract's milestones"
              />
              <CardBody>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">Total Value</span>
                    </div>
                    <p className="mt-1.5 text-lg font-bold text-ink-900">{formatETB(earnings.totalAmount)}</p>
                    <p className="text-[11px] text-gray-400">{earnings.totalCount} milestone{earnings.totalCount !== 1 ? 's' : ''}</p>
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600">Released</span>
                    </div>
                    <p className="mt-1.5 text-lg font-bold text-emerald-700">{formatETB(earnings.releasedAmount)}</p>
                    <p className="text-[11px] text-emerald-500">{earnings.releasedCount} milestone{earnings.releasedCount !== 1 ? 's' : ''}</p>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-medium text-blue-600">Pending</span>
                    </div>
                    <p className="mt-1.5 text-lg font-bold text-blue-700">{formatETB(earnings.pendingAmount)}</p>
                    <p className="text-[11px] text-blue-500">{earnings.pendingCount} milestone{earnings.pendingCount !== 1 ? 's' : ''}</p>
                  </div>

                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-medium text-amber-600">Fees</span>
                    </div>
                    <p className="mt-1.5 text-lg font-bold text-amber-700">{formatETB(earnings.totalFees)}</p>
                    <p className="text-[11px] text-amber-500">Platform + processing</p>
                  </div>
                </div>

                {/* Net earnings note */}
                <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Net after fees</span>
                    <span className="text-sm font-bold text-ink-900">{formatETB(earnings.totalNet)}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <Link
                    to="/freelancer/payments"
                    className="text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    View full transaction history →
                  </Link>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Reviews section when contract is completed */}
          {contract.status === 'completed' && (
            <Card>
              <CardHeader
                title="Reviews & Feedback"
                description="Client and freelancer feedback for this contract."
              />
              <CardBody>
                {contractReviews.length > 0 ? (
                  <ReviewList reviews={contractReviews} />
                ) : (
                  <p className="text-sm text-gray-500">No reviews have been submitted yet.</p>
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

                {!showReviewForm && !reviewSubmitted && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReviewForm(true)}
                    >
                      <Star className="h-4 w-4 text-amber-500" aria-hidden="true" /> Leave a Review
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <ContractSummary contract={contract} role="freelancer" />

          <Card>
            <CardFooter>
              <Button
                as={Link}
                to="/freelancer/contracts"
                variant="ghost"
                className="w-full"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to My Contracts
              </Button>
              <Button
                as={Link}
                to="/jobs"
                variant="outline"
                className="mt-2 w-full"
                size="sm"
              >
                <Briefcase className="h-4 w-4" aria-hidden="true" /> Find Jobs
              </Button>
            </CardFooter>
          </Card>
        </aside>
      </div>

      {/* Deliverable Work Submission Modal */}
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
