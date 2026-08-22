import { timeAgo } from './format';

/**
 * Map a Laravel `ProposalResource` payload to the UI model.
 *
 * Confirmed API fields:
 *   id, job_id, freelancer_id, cover_letter, bid_amount, currency,
 *   estimated_duration, status, job {id,title,slug},
 *   freelancer {id,name,avatar,headline,rating,review_count,verification_status,skills},
 *   portfolio_items [{id,title,description,project_url,image_url}],
 *   contract {id,status} | null, created_at, updated_at
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
      ? {
          id: proposal.freelancer.id,
          name: proposal.freelancer.name,
          avatar: proposal.freelancer.avatar,
          headline: proposal.freelancer.headline,
          rating: proposal.freelancer.rating ?? 0,
          reviewCount: proposal.freelancer.review_count ?? 0,
          verificationStatus: proposal.freelancer.verification_status ?? 'unverified',
          skills: proposal.freelancer.skills ?? [],
        }
      : null,
    portfolioItems: (proposal.portfolio_items || []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      projectUrl: item.project_url,
      imageUrl: item.image_url,
    })),
    contract: proposal.contract ? { id: proposal.contract.id, status: proposal.contract.status } : null,

    createdAt: proposal.created_at,
    createdAtLabel: timeAgo(proposal.created_at),
    updatedAt: proposal.updated_at,
  };
}

/**
 * Map proposal form state into the backend payload.
 */
export function proposalFormToPayload(form) {
  const payload = {
    cover_letter: form.coverLetter.trim(),
    bid_amount: Number(form.bidAmount),
    currency: (form.currency || '').trim().toUpperCase() || 'ETB',
    estimated_duration: form.estimatedDuration.trim(),
  };

  if (Array.isArray(form.portfolioItemIds) && form.portfolioItemIds.length > 0) {
    payload.portfolio_item_ids = form.portfolioItemIds;
  }

  return payload;
}
