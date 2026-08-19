import { timeAgo } from './format';
import { normalizeMilestone } from './milestoneMapper';

/**
 * Map a Laravel `ContractResource` payload to the UI model.
 *
 * Confirmed API fields:
 *   id, job_id, proposal_id, employer_id, freelancer_id, title, budget_type,
 *   agreed_rate, total_amount, currency ('ETB'), status, start_date, end_date,
 *   job {id,title,slug,budget_type,min_budget,max_budget,status,location_type,
 *        location,deadline},
 *   employer {id,name,email,role}, freelancer {id,name,email,role},
 *   milestones [...], summary { total_milestone_amount,
 *   completed_milestone_amount, remaining_milestone_amount, milestones_count,
 *   completed_milestones_count, pending_milestones_count, progress_percent },
 *   created_at, updated_at
 *
 * Contract statuses (backend enum): active, paused, completed, cancelled.
 */
export function normalizeContract(contract) {
  if (!contract) return null;

  return {
    id: contract.id,
    jobId: contract.job_id,
    proposalId: contract.proposal_id,
    employerId: contract.employer_id,
    freelancerId: contract.freelancer_id,

    title: contract.title,
    budgetType: contract.budget_type,
    agreedRate: contract.agreed_rate,
    totalAmount: contract.total_amount,
    currency: contract.currency ?? 'ETB',
    status: contract.status,
    startDate: contract.start_date,
    endDate: contract.end_date,

    job: contract.job
      ? {
          id: contract.job.id,
          title: contract.job.title,
          slug: contract.job.slug,
          budgetType: contract.job.budget_type,
          minBudget: contract.job.min_budget,
          maxBudget: contract.job.max_budget,
          status: contract.job.status,
          locationType: contract.job.location_type,
          location: contract.job.location,
          deadline: contract.job.deadline,
        }
      : null,
    employer: contract.employer
      ? {
          id: contract.employer.id,
          name: contract.employer.name,
          email: contract.employer.email,
        }
      : null,
    freelancer: contract.freelancer
      ? {
          id: contract.freelancer.id,
          name: contract.freelancer.name,
          email: contract.freelancer.email,
        }
      : null,

    milestones: (contract.milestones ?? []).map(normalizeMilestone).filter(Boolean),
    summary: contract.summary
      ? {
          totalMilestoneAmount: contract.summary.total_milestone_amount,
          completedMilestoneAmount: contract.summary.completed_milestone_amount,
          remainingMilestoneAmount: contract.summary.remaining_milestone_amount,
          milestonesCount: contract.summary.milestones_count,
          completedMilestonesCount: contract.summary.completed_milestones_count,
          pendingMilestonesCount: contract.summary.pending_milestones_count,
          progressPercent: contract.summary.progress_percent,
        }
      : null,

    createdAt: contract.created_at,
    createdAtLabel: timeAgo(contract.created_at),
    updatedAt: contract.updated_at,
    updatedAtLabel: timeAgo(contract.updated_at),
  };
}
