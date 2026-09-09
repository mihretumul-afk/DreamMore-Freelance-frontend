import { formatDate } from './format';

/** "entry" → "Entry", "not_available" → "Not available", etc. */
function humanize(value) {
  if (!value) return undefined;
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Map a Laravel `FreelancerProfileResource` payload to the UI model.
 *
 * Confirmed API fields:
 *   id, user_id, user {id,name,email,role,avatar,phone}, headline, overview,
 *   hourly_rate, experience_level, location, github_url, linkedin_url, website,
 *   total_earnings, completed_jobs_count, rating, availability_status,
 *   skills [{id,name,slug,years_of_experience}], created_at, updated_at
 */
export function normalizeFreelancer(profile) {
  if (!profile) return null;

  return {
    id: profile.id,
    userId: profile.user_id,

    // Approval status — null means the backend didn't send a status (treat as unknown/approved)
    approvalStatus: profile.approval_status ?? null,
    approvedAt: profile.approved_at,
    rejectionReason: profile.rejection_reason,

    // User
    name: profile.user?.name,
    email: profile.user?.email,
    avatar: profile.user?.avatar,
    phone: profile.user?.phone,

    // Professional info
    headline: profile.headline,
    overview: profile.overview,
    hourlyRate: profile.hourly_rate,
    location: profile.location,
    experienceLevel: profile.experience_level,
    experienceLevelLabel: humanize(profile.experience_level),
    availability: profile.availability_status ?? 'available',

    // Category mapping
    categoryId: profile.category_id ?? profile.category?.id ?? null,
    categorySlug: profile.category?.slug ?? profile.category_slug ?? null,
    categoryName: profile.category?.name ?? profile.category_name ?? null,

    // Stats
    rating: profile.rating ?? 0,
    completedJobsCount: profile.completed_jobs_count ?? 0,
    totalEarnings: profile.total_earnings ?? 0,

    // Skills with pivot years
    skills: (profile.skills ?? []).map((skill) => ({
      id: skill.id,
      name: skill.name,
      slug: skill.slug,
      yearsOfExperience: skill.years_of_experience,
    })),

    // Links
    githubUrl: profile.github_url,
    linkedinUrl: profile.linkedin_url,
    website: profile.website,

    // Meta
    memberSince: profile.created_at,
    memberSinceLabel: formatDate(profile.created_at),
  };
}

/**
 * Map a normalized freelancer profile into edit-form state (strings for text
 * inputs, ready-to-edit skills list).
 */
export function freelancerProfileToForm(profile) {
  if (!profile) return null;
  return {
    categoryId: profile.categoryId != null ? String(profile.categoryId) : '',
    headline: profile.headline ?? '',
    overview: profile.overview ?? '',
    hourlyRate: profile.hourlyRate != null ? String(profile.hourlyRate) : '',
    experienceLevel: profile.experienceLevel ?? 'intermediate',
    location: profile.location ?? '',
    githubUrl: profile.githubUrl ?? '',
    linkedinUrl: profile.linkedinUrl ?? '',
    website: profile.website ?? '',
    availability: profile.availability ?? 'available',
    skills: (profile.skills ?? []).map((skill) => ({
      id: skill.id,
      name: skill.name,
      yearsOfExperience: skill.yearsOfExperience ?? 1,
    })),
  };
}

/**
 * Map edit-form state into the backend PUT payload. Optional fields are sent
 * as null when empty (the backend ignores nulls, preserving previous values).
 */
export function freelancerFormToPayload(form) {
  return {
    category_id: form.categoryId ? Number(form.categoryId) : null,
    headline: form.headline.trim() || null,
    overview: form.overview.trim() || null,
    hourly_rate: form.hourlyRate === '' ? null : Number(form.hourlyRate),
    experience_level: form.experienceLevel,
    location: form.location.trim() || null,
    github_url: form.githubUrl.trim() || null,
    linkedin_url: form.linkedinUrl.trim() || null,
    website: form.website.trim() || null,
    availability_status: form.availability,
    skills: form.skills.map((skill) => ({
      id: skill.id,
      years_of_experience:
        skill.yearsOfExperience === '' || skill.yearsOfExperience == null
          ? 1
          : Number(skill.yearsOfExperience),
    })),
  };
}
