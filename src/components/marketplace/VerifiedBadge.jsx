import { BadgeCheck } from 'lucide-react';
import Badge from '../ui/Badge';
import { useI18n } from '../../i18n';

/**
 * "Verified" badge for freelancers, employers, and profiles.
 */
export default function VerifiedBadge({ label, size = 'xs', className }) {
  const { t } = useI18n();
  const displayLabel = label ?? t('status.verified');

  return (
    <Badge tone="success" size={size} className={className}>
      <BadgeCheck className="h-3 w-3" aria-hidden="true" />
      {displayLabel}
    </Badge>
  );
}
