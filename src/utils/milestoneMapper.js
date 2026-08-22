import { timeAgo } from './format';

/**
 * Map a deliverable submission resource payload to UI model.
 */
export function normalizeMilestoneSubmission(sub) {
  if (!sub) return null;

  return {
    id: sub.id,
    milestoneId: sub.milestone_id,
    submittedBy: sub.submitted_by,
    submitter: sub.submitter,
    description: sub.description,
    links: sub.links ?? [],
    status: sub.status,
    revisionNote: sub.revision_note,
    submittedAt: sub.submitted_at,
    submittedAtLabel: timeAgo(sub.submitted_at),
    reviewedAt: sub.reviewed_at,
    reviewedAtLabel: sub.reviewed_at ? timeAgo(sub.reviewed_at) : null,
    reviewedBy: sub.reviewed_by,
    reviewer: sub.reviewer,
    files: (sub.files || []).map((file) => ({
      id: file.id,
      originalFilename: file.original_filename,
      mimeType: file.mime_type,
      fileSize: file.file_size,
      downloadUrl: file.download_url,
      createdAt: file.created_at,
    })),
    createdAt: sub.created_at,
    updatedAt: sub.updated_at,
  };
}

/**
 * Map a Laravel `MilestoneResource` payload to the UI model.
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

    submissions: (milestone.submissions || []).map(normalizeMilestoneSubmission),
    latestSubmission: normalizeMilestoneSubmission(milestone.latest_submission),
    submissionsCount: milestone.submissions_count ?? (milestone.submissions?.length ?? 0),

    createdAt: milestone.created_at,
    createdAtLabel: timeAgo(milestone.created_at),
    updatedAt: milestone.updated_at,
  };
}

/**
 * Map milestone form state into the backend payload.
 */
export function milestoneFormToPayload(form) {
  return {
    title: (form.title || '').trim(),
    description: (form.description || '').trim() || null,
    amount: Number(form.amount),
    due_date: form.dueDate || null,
  };
}
