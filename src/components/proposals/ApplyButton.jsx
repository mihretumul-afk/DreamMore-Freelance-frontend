import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Send,
  ShieldAlert,
  Clock,
  XCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import StatusBadge from '../marketplace/StatusBadge';
import ProposalForm from './ProposalForm';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
import { proposalService } from '../../services/proposalService';
import { normalizeProposal, proposalFormToPayload } from '../../utils/proposalMapper';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { formatETB } from '../../utils/format';
import { ROLES } from '../../constants/app';

/** Proposal statuses that mean the freelancer has already applied. */
const BLOCKING_STATUSES = ['pending', 'shortlisted', 'accepted'];

/**
 * ApplyButton — smart apply button for job cards on the browse page.
 *
 * Behaviour:
 *  1. Not logged in          → click redirects to /login (with return state)
 *  2. Logged in as employer  → button is hidden (returns null)
 *  3. Freelancer, not approved → shows badge + link to /freelancer/credentials
 *  4. Freelancer, approved   → opens inline proposal modal
 *  5. Already applied        → shows "View Proposal" link
 *
 * Props:
 *  job         – normalized job object (needs id, title)
 *  size        – Button size prop ('sm' | 'md')
 *  className   – extra classes on the wrapper
 *  onApplied   – optional callback after successful submission
 */
export default function ApplyButton({ job, size = 'sm', className = '', onApplied }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [existing, setExisting] = useState(undefined); // undefined = not checked yet

  const isFreelancer = user?.role === ROLES.FREELANCER;
  const isApproved = user?.is_verified ?? user?.has_approved_credentials ?? false;
  const verificationStatus = user?.verification_status ?? (isApproved ? 'approved' : 'unverified');

  // Check if the freelancer already has a proposal for this job.
  const checkExisting = useCallback(async () => {
    if (!isFreelancer || !job?.id) return;
    try {
      let page = 1;
      let found = null;
      for (;;) {
        const res = await proposalService.getMyProposals({ page });
        const items = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        const meta = res.meta ?? res.data?.meta;
        found = items.find((p) => p.job_id === job.id) ?? null;
        if (found || !meta?.last_page || page >= meta.last_page) break;
        page += 1;
      }
      setExisting(found ? normalizeProposal(found) : null);
    } catch {
      setExisting(null);
    }
  }, [isFreelancer, job?.id]);

  useEffect(() => {
    checkExisting();
  }, [checkExisting]);

  const openModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFieldErrors({});
    setGeneralError(null);
    setSubmitted(null);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleSubmit = async (formValues) => {
    setFieldErrors({});
    setGeneralError(null);
    setSubmitting(true);
    try {
      const payload = proposalFormToPayload(formValues);
      const res = await proposalService.submitProposal(job.id, payload);
      const normalized = normalizeProposal(res.data?.proposal ?? res.data);
      setSubmitted(normalized);
      setExisting(normalized);
      onApplied?.(normalized);
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setGeneralError(getErrorMessage(err, t('proposals.submitError') ?? 'Failed to submit proposal.'));
    } finally {
      setSubmitting(false);
    }
  };

  // ── 1. Not logged in ──────────────────────────────────────────────
  if (!user) {
    return (
      <button
        type="button"
        className={`relative z-10 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 ${className}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigate('/login', { state: { from: location } });
        }}
      >
        <Send className="h-3.5 w-3.5" aria-hidden="true" />
        {t('proposals.apply') ?? 'Apply'}
      </button>
    );
  }

  // ── 2. Employer (or admin) — hide the button ──────────────────────
  if (!isFreelancer) return null;

  // ── 3. Freelancer with unapproved credentials ─────────────────────
  if (!isApproved) {
    const isPending = verificationStatus === 'pending';
    const isRejected = verificationStatus === 'rejected';

    return (
      <>
        <button
          type="button"
          title={
            isPending
              ? t('verifications.pendingMessage') ?? 'Your credentials are under review'
              : isRejected
                ? t('verifications.rejectedMessage') ?? 'Your credentials were rejected'
                : t('verifications.requiredMessage') ?? 'Credential approval required to apply'
          }
          className={`relative z-10 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 ${className}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate('/freelancer/credentials');
          }}
        >
          {isPending ? (
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          ) : isRejected ? (
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {isPending
            ? t('credentials.pendingShort') ?? 'Under Review'
            : isRejected
              ? t('credentials.resubmit') ?? 'Resubmit Docs'
              : t('credentials.verifyToApply') ?? 'Verify to Apply'}
        </button>
      </>
    );
  }

  // ── 4. Already has an active proposal ────────────────────────────
  if (existing && BLOCKING_STATUSES.includes(existing.status)) {
    return (
      <Link
        to={`/freelancer/proposals/${existing.id}`}
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-brand-400 hover:text-brand-600 ${className}`}
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        {t('proposals.applied') ?? 'Applied'}{' '}
        <StatusBadge status={existing.status} size="xs" />
      </Link>
    );
  }

  // ── 5. Approved freelancer — can apply ───────────────────────────
  return (
    <>
      <button
        type="button"
        className={`relative z-10 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60 ${className}`}
        onClick={openModal}
        disabled={submitting || existing === undefined /* still loading */}
      >
        <Send className="h-3.5 w-3.5" aria-hidden="true" />
        {existing === undefined
          ? '…'
          : existing
            ? t('proposals.reApply') ?? 'Apply Again'
            : t('proposals.apply') ?? 'Apply'}
      </button>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={t('proposals.submitProposal') ?? 'Submit Proposal'}
        description={`Place your bid for "${job?.title}".`}
        size="lg"
      >
        {submitted ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-50">
              <CheckCircle2 className="h-6 w-6 text-success-600" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-bold text-ink-900">
              {t('proposals.submittedSuccess') ?? 'Proposal submitted!'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Your bid of {formatETB(submitted.bidAmount)}
              {submitted.currency && submitted.currency !== 'ETB'
                ? ` ${submitted.currency}`
                : ''}{' '}
              is now pending review.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button as={Link} to="/freelancer/proposals" onClick={closeModal}>
                {t('proposals.myProposals') ?? 'My Proposals'}
              </Button>
              <Button variant="outline" onClick={closeModal}>
                {t('common.done') ?? 'Done'}
              </Button>
            </div>
          </div>
        ) : (
          <ProposalForm
            submitLabel={t('proposals.submitProposal') ?? 'Submit Proposal'}
            submitting={submitting}
            fieldErrors={fieldErrors}
            generalError={generalError}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        )}
      </Modal>
    </>
  );
}
