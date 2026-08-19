import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Send } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import StatusBadge from '../marketplace/StatusBadge';
import ProposalForm from './ProposalForm';
import { useAuth } from '../../hooks/useAuth';
import { proposalService } from '../../services/proposalService';
import { normalizeProposal, proposalFormToPayload } from '../../utils/proposalMapper';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { formatETB } from '../../utils/format';
import { ROLES } from '../../constants/app';

/** Statuses that block a new submission for the same job (backend rule). */
const BLOCKING_STATUSES = ['pending', 'shortlisted', 'accepted'];

/**
 * Job details CTA — the real proposal entry point.
 *
 * - Unauthenticated: signs in, preserving the current job as the destination.
 * - Employers: no freelancer submission UI.
 * - Freelancers: detects an existing proposal for this job (paginated search
 *   over GET /proposals) and either links to it or offers the submission form.
 *
 * The backend remains the source of truth for duplicates and authorization —
 * this panel only mirrors what the API confirms.
 */
export default function JobProposalPanel({ job, onProposalSubmitted }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [checking, setChecking] = useState(false);
  const [existing, setExisting] = useState(null); // normalized proposal or null
  const [checkFailed, setCheckFailed] = useState(false);

  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [submitted, setSubmitted] = useState(null); // normalized proposal after success

  const isFreelancer = user?.role === ROLES.FREELANCER;

  // Find any proposal the freelancer already has for this job. The list is
  // paginated, so walk pages until found or exhausted (bounded by last_page).
  const checkExisting = useCallback(async () => {
    if (!isFreelancer || !job?.id) return;
    setChecking(true);
    setCheckFailed(false);
    try {
      let page = 1;
      let found = null;
      for (;;) {
        const res = await proposalService.getMyProposals({ page });
        const items = res.data?.data ?? [];
        const meta = res.data?.meta;
        found = items.find((p) => p.job_id === job.id) ?? null;
        if (found || !meta || page >= (meta.last_page ?? 1)) break;
        page += 1;
      }
      setExisting(found ? normalizeProposal(found) : null);
    } catch {
      // Can't confirm — submitting is still offered; the backend enforces duplicates.
      setExisting(null);
      setCheckFailed(true);
    } finally {
      setChecking(false);
    }
  }, [isFreelancer, job?.id]);

  useEffect(() => {
    checkExisting();
  }, [checkExisting]);

  const openSubmit = () => {
    setFieldErrors({});
    setGeneralError(null);
    setSubmitted(null);
    setSubmitOpen(true);
  };

  const closeSubmit = () => {
    if (!submitting) setSubmitOpen(false);
  };

  const handleSubmit = async (form) => {
    setSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);
    try {
      const res = await proposalService.createProposal(job.id, proposalFormToPayload(form));
      setSubmitted(normalizeProposal(res.data?.data));
      // proposals_count changed server-side — let the parent refresh the job.
      onProposalSubmitted?.();
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      const hasFieldErrors = Object.keys(getFieldErrors(err)).length > 0;
      setGeneralError(
        hasFieldErrors
          ? null
          : getErrorMessage(err, 'Unable to submit your proposal. Please try again.'),
      );
      setSubmitting(false);
    }
  };

  const handleSignIn = () => {
    navigate('/login', { state: { from: location } });
  };

  // --- Unauthenticated ---
  if (!user) {
    return (
      <div className="space-y-2">
        <Button className="w-full" onClick={handleSignIn}>
          <Send className="h-4 w-4" aria-hidden="true" /> Submit Proposal
        </Button>
        <p className="text-center text-xs text-gray-400">
          Sign in as a freelancer to submit a proposal.
        </p>
      </div>
    );
  }

  // --- Employers don't see a submission form ---
  if (!isFreelancer) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 px-4 py-3 text-center text-xs text-gray-500">
        Only freelancer accounts can submit proposals for this job.
      </p>
    );
  }

  // --- Freelancer with an active proposal already submitted ---
  if (existing && BLOCKING_STATUSES.includes(existing.status)) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink-900">Proposal already submitted</p>
          <StatusBadge status={existing.status} />
        </div>
        <p className="text-xs text-gray-500">
          You have an active proposal for this job — you cannot submit another while it is in
          review.
        </p>
        <Button as={Link} to={`/freelancer/proposals/${existing.id}`} variant="outline" className="w-full" size="sm">
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> View Proposal
        </Button>
      </div>
    );
  }

  // --- Freelancer: can submit (none, rejected, or withdrawn) ---
  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={openSubmit} disabled={checking || submitting}>
        <Send className="h-4 w-4" aria-hidden="true" /> Submit Proposal
      </Button>
      {existing && (
        <p className="text-center text-xs text-gray-400">
          Your previous proposal for this job was {existing.status.replace('_', ' ')} — you can
          submit a new one.
        </p>
      )}
      {checkFailed && (
        <p className="text-center text-xs text-amber-600">
          Could not check for an existing proposal — if you already have an active one, the server
          will reject the duplicate.
        </p>
      )}

      <Modal
        open={submitOpen}
        onClose={closeSubmit}
        title="Submit proposal"
        description={`Place your bid for “${job.title}”.`}
        size="lg"
      >
        {submitted ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-50">
              <CheckCircle2 className="h-6 w-6 text-success-600" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-bold text-ink-900">Proposal submitted</h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Your bid of {formatETB(submitted.bidAmount)}
              {submitted.currency && submitted.currency !== 'ETB' ? ` ${submitted.currency}` : ''} is
              now pending review.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button as={Link} to="/freelancer/proposals" onClick={closeSubmit}>
                View My Proposals
              </Button>
              <Button variant="outline" onClick={closeSubmit}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <ProposalForm
            submitLabel="Submit Proposal"
            submitting={submitting}
            fieldErrors={fieldErrors}
            generalError={generalError}
            onSubmit={handleSubmit}
            onCancel={closeSubmit}
          />
        )}
      </Modal>
    </div>
  );
}
