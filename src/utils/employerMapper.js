import { formatDate } from './format';

/**
 * Map a Laravel `EmployerProfileResource` payload to the UI model.
 *
 * Confirmed API fields:
 *   id, user_id, user {id,name,email,role,status,avatar,phone,bio},
 *   company_name, company_description, website, industry, company_size,
 *   location, total_spent, posted_jobs_count, rating, created_at, updated_at
 */
export function normalizeEmployer(profile) {
  if (!profile) return null;

  return {
    id: profile.id,
    userId: profile.user_id,

    // User
    name: profile.user?.name,
    email: profile.user?.email,
    avatar: profile.user?.avatar,
    phone: profile.user?.phone,
    bio: profile.user?.bio,

    // Company
    companyName: profile.company_name,
    companyDescription: profile.company_description,
    website: profile.website,
    industry: profile.industry,
    companySize: profile.company_size,
    location: profile.location,

    // Stats
    rating: profile.rating ?? 0,
    totalSpent: profile.total_spent ?? 0,
    postedJobsCount: profile.posted_jobs_count ?? 0,

    // Meta
    memberSince: profile.created_at,
    memberSinceLabel: formatDate(profile.created_at),
  };
}

/**
 * Map a normalized employer profile into edit-form state (strings for text
 * inputs).
 */
export function employerProfileToForm(profile) {
  if (!profile) return null;
  return {
    companyName: profile.companyName ?? '',
    companyDescription: profile.companyDescription ?? '',
    industry: profile.industry ?? '',
    companySize: profile.companySize ?? '',
    location: profile.location ?? '',
    website: profile.website ?? '',
    phone: profile.phone ?? '',
    bio: profile.bio ?? '',
  };
}

/**
 * Map edit-form state into the backend PUT payload. `phone` and `bio` live on
 * the user record (the controller routes them there); optional fields are sent
 * as null when empty (the backend ignores nulls, preserving previous values).
 */
export function employerFormToPayload(form) {
  return {
    company_name: form.companyName.trim() || null,
    company_description: form.companyDescription.trim() || null,
    industry: form.industry.trim() || null,
    company_size: form.companySize.trim() || null,
    location: form.location.trim() || null,
    website: form.website.trim() || null,
    phone: form.phone.trim() || null,
    bio: form.bio.trim() || null,
  };
}
