import Badge from '../ui/Badge';
import { useI18n } from '../../i18n';

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
  withdrawn: 'neutral',
  // Contract / milestone statuses
  active: 'success',
  paused: 'warning',
  awaiting_funding: 'warning',
  funded: 'info',
  in_progress: 'info',
  submitted: 'warning',
  revision_requested: 'warning',
  approved: 'success',
  released: 'success',
  paid: 'success',
  completed: 'success',
  cancelled: 'danger',
  disputed: 'danger',
  resolved: 'success',
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
 * status → tone mapping for a specific feature. Automatically uses i18n
 * dictionary keys (status.{status}).
 */
export default function StatusBadge({ status, label, toneMap, size = 'xs', dot = false, className }) {
  const { t } = useI18n();
  const tone = toneMap?.[status] ?? DEFAULT_TONES[status] ?? 'neutral';
  const statusKey = status ? `status.${status}` : null;
  const translated = statusKey ? t(statusKey) : null;
  const displayLabel = label ?? (translated && translated !== statusKey ? translated : humanize(status));

  return (
    <Badge tone={tone} size={size} dot={dot} className={className}>
      {displayLabel}
    </Badge>
  );
}
