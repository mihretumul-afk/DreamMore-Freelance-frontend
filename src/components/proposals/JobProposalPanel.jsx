import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Send, ShieldAlert, Clock, XCircle, Award } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import StatusBadge from '../marketplace/StatusBadge';
import ProposalForm from './ProposalForm';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
import { proposalService } from '../../services/proposalService';
import { normalizeProposal, proposalFormToPayload } from '../../utils/proposalMapper';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { formatETB } from '../../utils/format';
import { ROLES } from '../../constants/app';

/** Statuses that block a new submission for the same job (backend rule). */
const BLOCKING_STATUSES = ['pending', 'shortlisted', 'accepted'];

export default function JobProposalPanel({ job, onProposalSubmitted }) {
  const { user } = useAuth();
  const { t } = useI18n();
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
  // Must match EnsureVerifiedFreelancer middleware: profile approved + credentials approved.
  const isApproved = user?.is_fully_approved ?? false;
  const verificationStatus = user?.verification_status ?? (isApproved ? 'approved' : 'unverified');

  // Find any proposal the freelancer already has for this job.
  const checkExisting = useCallback(async () => {
    if (!isFreelancer || !job?.id) return;
    setChecking(true);
    setCheckFailed(false);
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
    setSubmitOpen(false);
  };

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
      onProposalSubmitted?.(normalized);
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setGeneralError(getErrorMessage(err, 'Failed to submit proposal. Please try again.'));
    } finally {
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
          <Send className="h-4 w-4" aria-hidden="true" /> {t('proposals.submitProposal')}
        </Button>
        <p className="text-center text-xs text-gray-400">
          {t('proposals.signInToSubmit')}
        </p>
      </div>
    );
  }

  // --- Employers don't see a submission form ---
  if (!isFreelancer) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 px-4 py-3 text-center text-xs text-gray-500">
        {t('proposals.onlyFreelancersCanSubmit')}
      </p>
    );
  }

  // --- Freelancer with unapproved credentials (Pending, Rejected, or Unverified) ---
  if (!isApproved) {
    const isPending = verificationStatus === 'pending';
    const isRejected = verificationStatus === 'rejected';

    return (
      <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-left">
        <div className="flex items-start gap-2.5">
          {isPending ? (
            <Clock className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
          ) : isRejected ? (
            <XCircle className="h-5 w-5 shrink-0 text-danger-600 mt-0.5" aria-hidden="true" />
          ) : (
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-900">
                {t('verifications.required')}
              </p>
              <Badge tone={isPending ? 'warning' : isRejected ? 'danger' : 'neutral'} size="xs">
                {isPending
                  ? t('status.pendingReview')
                  : isRejected
                    ? t('status.rejected')
                    : t('verifications.actionRequired')}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-ink-700 leading-relaxed font-medium">
              {t('verifications.mandatoryRuleMessage')}
            </p>
          </div>
        </div>

        <Button
          as={Link}
          to="/freelancer/credentials"
          variant={isRejected ? 'danger' : 'outline'}
          size="sm"
          className="w-full"
        >
          <Award className="h-4 w-4" aria-hidden="true" />
          {isPending
            ? t('credentials.viewStatus')
            : isRejected
              ? t('credentials.submitNew')
              : t('credentials.submitForApproval')}
        </Button>
      </div>
    );
  }

  // --- Freelancer with an active proposal already submitted ---
  if (existing && BLOCKING_STATUSES.includes(existing.status)) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink-900">{t('proposals.alreadySubmitted')}</p>
          <StatusBadge status={existing.status} />
        </div>
        <p className="text-xs text-gray-500">
          {t('proposals.alreadySubmitted')}
        </p>
        <Button as={Link} to={`/freelancer/proposals/${existing.id}`} variant="outline" className="w-full" size="sm">
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> {t('proposals.viewProposal')}
        </Button>
      </div>
    );
  }

  // --- Freelancer: approved and can submit ---
  return (
    <div className="space-y-2">
      <Button
        as={Link}
        to={`/freelancer/jobs/${job.id}/apply`}
        className="w-full"
        disabled={checking}
      >
        <Send className="h-4 w-4" aria-hidden="true" /> {t('proposals.submitProposal')}
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
    </div>
  );
}
