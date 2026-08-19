import { timeAgo } from './format';

/**
 * Map a Laravel `MilestoneResource` payload to the UI model.
 *
 * Confirmed API fields:
 *   id, contract_id, title, description, amount, currency ('ETB'), status,
 *   due_date, submitted_at, approved_at, created_at, updated_at
 *
 * Milestone statuses (backend enum):
 *   pending → in_progress → submitted → approved → paid
 *   (submitted → in_progress via employer revision request)
 */
export function normalizeMilestone(milestone) {
  if (!milestone) return null;

  return {
    id: milestone.id,
    contractId: milestone.contract_id,

    title: milestone.title,
    description: milestone.description,
    amount: milestone.amount,
    currency: milestone.currency ?? 'ETB',
    status: milestone.status,

    dueDate: milestone.due_date,
    submittedAt: milestone.submitted_at,
    approvedAt: milestone.approved_at,

    createdAt: milestone.created_at,
    createdAtLabel: timeAgo(milestone.created_at),
    updatedAt: milestone.updated_at,
  };
}

/**
 * Map milestone form state into the backend payload (MilestoneRequest rules:
 * title required ≤255, description nullable ≤5000, amount numeric 1–99999999.99,
 * due_date nullable date). Sending null for optional fields lets the backend
 * clear them on update.
 */
export function milestoneFormToPayload(form) {
  return {
    title: (form.title || '').trim(),
    description: (form.description || '').trim() || null,
    amount: Number(form.amount),
    due_date: form.dueDate || null,
  };
}
