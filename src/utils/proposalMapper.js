import { timeAgo } from './format';

/**
 * Map a Laravel `ProposalResource` payload to the UI model.
 *
 * Confirmed API fields:
 *   id, job_id, freelancer_id, cover_letter, bid_amount, currency,
 *   estimated_duration, status, job {id,title,slug},
 *   freelancer {id,name,avatar}, contract {id,status} | null,
 *   created_at, updated_at
 */
export function normalizeProposal(proposal) {
  if (!proposal) return null;

  return {
    id: proposal.id,
    jobId: proposal.job_id,
    freelancerId: proposal.freelancer_id,

    coverLetter: proposal.cover_letter,
    bidAmount: proposal.bid_amount,
    currency: proposal.currency,
    estimatedDuration: proposal.estimated_duration,
    status: proposal.status,

    job: proposal.job
      ? { id: proposal.job.id, title: proposal.job.title, slug: proposal.job.slug }
      : null,
    jobTitle: proposal.job?.title,
    freelancer: proposal.freelancer
      ? { id: proposal.freelancer.id, name: proposal.freelancer.name, avatar: proposal.freelancer.avatar }
      : null,
    contract: proposal.contract ? { id: proposal.contract.id, status: proposal.contract.status } : null,

    createdAt: proposal.created_at,
    createdAtLabel: timeAgo(proposal.created_at),
    updatedAt: proposal.updated_at,
  };
}

/**
 * Map proposal form state into the backend payload (ProposalRequest rules:
 * cover_letter required ≤5000, bid_amount numeric 1–99999999.99, currency
 * optional size:3, estimated_duration required ≤255).
 */
export function proposalFormToPayload(form) {
  return {
    cover_letter: form.coverLetter.trim(),
    bid_amount: Number(form.bidAmount),
    currency: (form.currency || '').trim().toUpperCase() || 'ETB',
    estimated_duration: form.estimatedDuration.trim(),
  };
}
