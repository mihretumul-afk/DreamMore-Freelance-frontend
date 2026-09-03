import { timeAgo } from './format';

/** "entry" → "Entry", "location_type" → "Location type", etc. */
function humanize(value) {
  if (!value) return undefined;
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Map a Laravel `JobResource` payload to the UI job model.
 *
 * API (confirmed from JobResource):
 *   id, title, slug, description, budget_type, min_budget, max_budget, currency,
 *   experience_level, location_type, location, status, proposals_count, deadline,
 *   published_at, created_at, category {id,name,slug}, skills [{id,name,slug}],
 *   employer {id,name,avatar}
 *
 * UI model keeps JobCard's expected shape (title, company, category, location,
 * budget, interval, jobType, experienceLevel, postedAt, proposalCount, skills).
 */
export function normalizeJob(job) {
  if (!job) return null;

  const budgetType = job.budget_type;
  const minBudget = job.min_budget;
  const maxBudget = job.max_budget;
  const hasRange = minBudget != null && maxBudget != null && Number(maxBudget) > Number(minBudget);

  return {
    id: job.id,
    title: job.title,
    slug: job.slug,
    description: job.description,
    status: job.status,
    currency: job.currency,

    // Employer
    employer: job.employer
      ? { id: job.employer.id, name: job.employer.name, avatar: job.employer.avatar }
      : null,
    company: job.employer?.name,

    // Category & skills — `category` is the display string (JobCard renders it
    // directly); `categoryObject` keeps the full record for detail pages.
    category: job.category?.name ?? null,
    categoryName: job.category?.name,
    categoryObject: job.category
      ? { id: job.category.id, name: job.category.name, slug: job.category.slug }
      : null,
    skills: job.skills ?? [],

    // Budget
    budgetType,
    budget: hasRange ? maxBudget : (maxBudget ?? minBudget),
    minBudget,
    maxBudget,
    hasRange,
    interval: budgetType === 'hourly' ? 'hr' : undefined,

    // Job type / experience (display labels for the UI)
    jobType: budgetType === 'hourly' ? 'Hourly' : budgetType === 'fixed' ? 'Fixed price' : undefined,
    experienceLevel: humanize(job.experience_level),
    locationType: job.location_type,
    locationTypeLabel: humanize(job.location_type),
    location: job.location || (job.location_type === 'remote' ? 'Remote' : undefined),

    // Activity
    proposalsCount: job.proposals_count,
    deadline: job.deadline,
    publishedAt: job.published_at,
    createdAt: job.created_at,
    postedAtLabel: timeAgo(job.published_at ?? job.created_at),

    // Featured status (set by backend query or API)
    featured: job.featured ?? false,
  };
}
