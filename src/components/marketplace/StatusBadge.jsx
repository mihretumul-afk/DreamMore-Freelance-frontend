import Badge from '../ui/Badge';

/**
 * Maps common marketplace statuses to badge tones. Later features (jobs,
 * proposals, contracts, milestones, verification, availability) all reuse this
 * single mapping instead of duplicating status styling.
 */
const DEFAULT_TONES = {
  // Job statuses
  open: 'success',
  closed: 'neutral',
  draft: 'neutral',
  published: 'info',
  expired: 'neutral',
  featured: 'primary',
  // Proposal statuses
  pending: 'warning',
  submitted: 'warning',
  shortlisted: 'info',
  rejected: 'danger',
  hired: 'success',
  accepted: 'success',
  // Contract / milestone statuses
  active: 'success',
  paused: 'warning',
  in_progress: 'info',
  approved: 'success',
  paid: 'success',
  completed: 'success',
  cancelled: 'danger',
  // Availability
  available: 'success',
  busy: 'warning',
  not_available: 'neutral',
  // Verification
  verified: 'success',
  unverified: 'neutral',
};

function humanize(status) {
  return String(status ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Badge for a marketplace status. Pass `toneMap` to override the default
 * status → tone mapping for a specific feature.
 */
export default function StatusBadge({ status, label, toneMap, size = 'xs', dot = false, className }) {
  const tone = toneMap?.[status] ?? DEFAULT_TONES[status] ?? 'neutral';
  return (
    <Badge tone={tone} size={size} dot={dot} className={className}>
      {label ?? humanize(status)}
    </Badge>
  );
}
