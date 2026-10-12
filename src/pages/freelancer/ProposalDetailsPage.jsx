import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Handshake,
  Pencil,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import PageHeader from '../../components/marketplace/PageHeader';
import StatusBadge from '../../components/marketplace/StatusBadge';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import ProposalPortfolioGallery from '../../components/proposals/ProposalPortfolioGallery';
import ProposalForm from '../../components/proposals/ProposalForm';
import ConfirmActionModal from '../../components/proposals/ConfirmActionModal';
import ProposalSkeleton from '../../components/proposals/ProposalSkeleton';
import { proposalService } from '../../services/proposalService';
import { normalizeProposal, proposalFormToPayload } from '../../utils/proposalMapper';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { formatDate, formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';

/** Statuses in which the freelancer may still edit/withdraw (backend rule). */
const EDITABLE_STATUSES = ['pending', 'shortlisted'];

export default function FreelancerProposalDetailsPage() {
  usePageTitle('Proposal Details');
  const { id } = useParams();
  const { addToast } = useToast();

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [editing, setEditing] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [acting, setActing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [notice, setNotice] = useState(null);

  const loadProposal = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    setForbidden(false);
    try {
      const res = await proposalService.getProposal(id);
      if (res.success) {
        setProposal(normalizeProposal(res.data));
      } else {
        setError(res.message || 'Proposal not found.');
        setNotFound(true);
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        setNotFound(true);
        setError('This proposal does not exist or is no longer available.');
      } else if (status === 403) {
        setForbidden(true);
        setError(err.response.data?.message || 'You do not have access to this proposal.');
      } else {
        setError(getErrorMessage(err, 'Unable to load this proposal. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProposal();
  }, [loadProposal]);

  const handleEditSubmit = async (form) => {
    setActing(true);
    setFieldErrors({});
    setGeneralError(null);
    try {
      const res = await proposalService.updateProposal(proposal.id, proposalFormToPayload(form));
      setProposal(normalizeProposal(res.data?.proposal ?? res.data));
      setEditing(false);
      setNotice('Proposal updated successfully.');
      addToast('Proposal updated successfully.', 'success');
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      const hasFieldErrors = Object.keys(getFieldErrors(err)).length > 0;
      const errMsg = getErrorMessage(err, 'Unable to update your proposal. Please try again.');
      setGeneralError(hasFieldErrors ? null : errMsg);
      addToast(errMsg, 'error');
      setActing(false);
    }
  };

  const handleWithdraw = async () => {
    setActing(true);
    setGeneralError(null);
    try {
      const res = await proposalService.withdrawProposal(proposal.id);
      setProposal(normalizeProposal(res.data?.proposal ?? res.data));
      setWithdrawOpen(false);
      setNotice('Proposal withdrawn.');
      addToast('Proposal withdrawn successfully.', 'info');
    } catch (err) {
      const errMsg = getErrorMessage(err, 'Unable to withdraw your proposal. Please try again.');
      setGeneralError(errMsg);
      addToast(errMsg, 'error');
      setActing(false);
    }
  };

  if (loading) return <ProposalSkeleton />;

  if (error || !proposal) {
    return (
      <ErrorState
        title={notFound ? 'Proposal not found' : forbidden ? 'Access denied' : 'Unable to load this proposal'}
        description={error}
        onRetry={loadProposal}
      />
    );
  }

  const editable = EDITABLE_STATUSES.includes(proposal.status);
  const initialForm = {
    coverLetter: proposal.coverLetter ?? '',
    bidAmount: proposal.bidAmount != null ? String(proposal.bidAmount) : '',
    currency: proposal.currency ?? 'ETB',
    estimatedDuration: proposal.estimatedDuration ?? '',
    portfolioItemIds: (proposal.portfolioItems || []).map((i) => i.id),
  };

  const isAccepted = proposal.status === 'accepted';

  return (
    <div className="space-y-6">
      {/* Accepted Banner */}
      {isAccepted && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-extrabold text-emerald-900">Proposal Accepted! 🎉</h2>
              <p className="mt-1 text-sm text-emerald-700">
                The employer has accepted your proposal. A contract has been created. Go to your Contracts page to accept it and start working.
              </p>
              <div className="mt-3 flex gap-2">
                <Button as={Link} to="/freelancer/contracts" variant="success" size="sm">
                  <Handshake className="h-4 w-4" /> View Contracts
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        eyebrow="Freelancer"
        title="Proposal Details"
        breadcrumbs={[
          { label: 'My Proposals', to: '/freelancer/proposals' },
          { label: proposal.jobTitle ?? `Proposal #${proposal.id}` },
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* Main */}
        <div className="min-w-0 space-y-6">
          {/* Job */}
          <Card>
            <CardHeader title="Job" />
            <CardBody>
              {proposal.jobTitle ? (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Link
                    to={`/jobs/${proposal.jobId}`}
                    className="text-base font-bold text-ink-900 transition-colors hover:text-brand-600 break-words"
                  >
                    {proposal.jobTitle}
                  </Link>
                  {isAccepted && proposal.contractId && (
                    <Button as={Link} to={`/freelancer/contracts/${proposal.contractId}`} size="xs" variant="success">
                      <Handshake className="h-3.5 w-3.5" /> View Contract
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">This job is no longer available.</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Job ID {proposal.jobId} · Submitted{' '}
                {proposal.createdAtLabel ?? formatDate(proposal.createdAt)}
              </p>
            </CardBody>
          </Card>

          {/* Cover letter */}
          <Card>
            <CardHeader title="Cover letter" />
            <CardBody>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {proposal.coverLetter || 'No cover letter provided.'}
              </p>
            </CardBody>
          </Card>

          {/* Attached Portfolio Projects */}
          {proposal.portfolioItems && proposal.portfolioItems.length > 0 && (
            <ProposalPortfolioGallery items={proposal.portfolioItems} />
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <Card>
            <CardHeader title="Proposal summary" />
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500">Status</span>
                <StatusBadge status={proposal.status} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500">Bid amount</span>
                <span className="text-base font-extrabold text-ink-900">
                  {formatETB(proposal.bidAmount)}
                  {proposal.currency && proposal.currency !== 'ETB' ? ` ${proposal.currency}` : ''}
                </span>
              </div>
              {proposal.estimatedDuration && (
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Clock className="h-4 w-4" aria-hidden="true" /> Duration
                  </span>
                  <span className="text-right text-sm font-medium text-ink-900">
                    {proposal.estimatedDuration}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" /> Submitted
                </span>
                <span className="text-sm font-medium text-ink-900">
                  {formatDate(proposal.createdAt)}
                </span>
              </div>
              {proposal.updatedAt && (
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" /> Last updated
                  </span>
                  <span className="text-sm font-medium text-ink-900">
                    {formatDate(proposal.updatedAt)}
                  </span>
                </div>
              )}
            </CardBody>
            <div className="space-y-2 border-t border-gray-100 px-5 py-4">
              {isAccepted && proposal.contractId && (
                <Button as={Link} to={`/freelancer/contracts/${proposal.contractId}`} className="w-full" size="sm" variant="success">
                  <Handshake className="h-4 w-4" /> View Contract
                </Button>
              )}
              {isAccepted && (
                <Button as={Link} to="/freelancer/contracts" className="w-full" size="sm" variant="outline">
                  All Contracts
                </Button>
              )}
              {editable && !editing && (
                <>
                  <Button className="w-full" size="sm" onClick={() => setEditing(true)}>
                    <Pencil className="h-4 w-4" aria-hidden="true" /> Edit Proposal
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full"
                    size="sm"
                    onClick={() => setWithdrawOpen(true)}
                  >
                    Withdraw Proposal
                  </Button>
                </>
              )}
              <Button
                as={Link}
                to="/freelancer/proposals"
                variant="ghost"
                className="w-full"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to My Proposals
              </Button>
            </div>
          </Card>

          {editing && (
            <Card>
              <CardHeader title="Edit proposal" />
              <CardBody>
                <ProposalForm
                  key={proposal.id}
                  initialValues={initialForm}
                  submitLabel="Save Changes"
                  submitting={acting}
                  fieldErrors={fieldErrors}
                  generalError={generalError}
                  onSubmit={handleEditSubmit}
                  onCancel={() => {
                    setEditing(false);
                    setFieldErrors({});
                    setGeneralError(null);
                  }}
                />
              </CardBody>
            </Card>
          )}
        </aside>
      </div>

      <ConfirmActionModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        title="Withdraw proposal?"
        description="Are you sure you want to withdraw this proposal? You can submit a new proposal for this job later."
        confirmLabel="Withdraw Proposal"
        tone="danger"
        busy={acting}
        error={generalError}
        onConfirm={handleWithdraw}
      />
    </div>
  );
}
