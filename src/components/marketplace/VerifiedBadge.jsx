import { BadgeCheck } from 'lucide-react';
import Badge from '../ui/Badge';

/**
 * "Verified" badge for freelancers, employers, and profiles.
 */
export default function VerifiedBadge({ label = 'Verified', size = 'xs', className }) {
  return (
    <Badge tone="success" size={size} className={className}>
      <BadgeCheck className="h-3 w-3" aria-hidden="true" />
      {label}
    </Badge>
  );
}
