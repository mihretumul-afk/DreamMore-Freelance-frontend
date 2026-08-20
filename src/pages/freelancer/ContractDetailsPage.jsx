import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, CalendarDays, CheckCircle2, MapPin, Star } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import PageHeader from '../../components/marketplace/PageHeader';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ContractDetailSkeleton } from '../../components/contracts/ContractSkeleton';
import ContractHeader from '../../components/contracts/ContractHeader';
import ContractSummary from '../../components/contracts/ContractSummary';
import MilestoneList from '../../components/contracts/MilestoneList';
import ReviewForm from '../../components/ui/ReviewForm';
import ReviewList from '../../components/ui/ReviewList';
import ConfirmActionModal from '../../components/proposals/ConfirmActionModal';
import { contractService } from '../../services/contractService';
import { milestoneService } from '../../services/milestoneService';
import { reviewService } from '../../services/reviewService';
import { normalizeContract } from '../../utils/contractMapper';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';

const SUBMIT_DIALOG = {
  title: 'Submit milestone?',
  description:
    'Submitting sends this milestone to the employer for review. It can no longer be edited until the employer requests a revision.',
  confirmLabel: 'Submit Milestone',
  tone: 'primary',
};

export default function FreelancerContractDetailsPage() {
  usePageTitle('Contract Details');
  const { id } = useParams();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [milestoneAction, setMilestoneAction] = useState(null); // { milestone, kind }
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [contractReviews, setContractReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

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
          // Check if current user has already reviewed
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

  const openMilestoneAction = (milestone, _kind) => {
    setActionError(null);
    setMilestoneAction({ milestone, kind: 'submit' });
  };

  const handleMilestoneAction = async () => {
    if (!milestoneAction) return;
    const { milestone } = milestoneAction;
    setActing(true);
    setActionError(null);
    try {
      const res = await milestoneService.submitMilestone(contract.id, milestone.id);
      setNotice(res.message || 'Milestone submitted for review.');
      setMilestoneAction(null);
      // Refresh real contract data (milestones + summary come from the server).
      await loadContract(true);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to submit this milestone. Please try again.'));
      setActing(false);
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
  // The public job page only shows open jobs — link there only when public.
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
                      ? `Budget ${formatETB(job.minBudget)}–${formatETB(job.maxBudget)} · `
                      : ''}
                    {job.locationType && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" aria-hidden="true" />
                        {job.locationType === 'remote' ? 'Remote' : job.location || job.locationType}
                      </span>
                    )}
                    {job.deadline && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" aria-hidden="true" />
                        Deadline {formatDate(job.deadline)}
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  Job information is no longer available.
                </p>
              )}
            </CardBody>
          </Card>

          {/* Milestones */}
          <MilestoneList
            contract={contract}
            role="freelancer"
            busyAction={milestoneAction?.milestone.id ?? null}
            onMilestoneAction={openMilestoneAction}
          />
        </div>

      {/* Review section for completed contracts */}
      {contract.status === 'completed' && (
        <Card>
          <CardHeader title="Review" description="Share your experience working on this contract." />
          <CardBody>
            {contractReviews.length > 0 && !showReviewForm ? (
              <div>
                <ReviewList reviews={contractReviews} />
              </div>
            ) : showReviewForm || reviewSubmitted ? (
              <div>
                {reviewSubmitted ? (
                  <div className="flex items-center gap-2 text-success-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="text-sm font-medium">Review submitted successfully!</p>
                  </div>
                ) : (
                  <ReviewForm
                    contractId={contract.id}
                    revieweeName={contract.employer?.name || 'the employer'}
                    onSubmitted={() => {
                      setReviewSubmitted(true);
                      setShowReviewForm(false);
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Star className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No reviews yet for this contract.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => setShowReviewForm(true)}
                >
                  Leave a Review
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}

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
                to="/freelancer/jobs"
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

      <ConfirmActionModal
        open={Boolean(milestoneAction)}
        onClose={() => setMilestoneAction(null)}
        title={SUBMIT_DIALOG.title}
        description={SUBMIT_DIALOG.description}
        confirmLabel={SUBMIT_DIALOG.confirmLabel}
        tone={SUBMIT_DIALOG.tone}
        busy={acting}
        error={actionError}
        onConfirm={handleMilestoneAction}
      />
    </div>
  );
}
