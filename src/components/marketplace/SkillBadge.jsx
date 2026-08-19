import { cn } from '../../utils/cn';

/**
 * Compact skill pill (ink-tinted), used inside job and freelancer cards.
 */
export default function SkillBadge({ children, className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-ink-50 px-2 py-1 text-[11px] font-medium text-ink-700',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
