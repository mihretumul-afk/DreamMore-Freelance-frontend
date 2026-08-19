import { cn } from '../../utils/cn';

/**
 * Accessible milestone progress bar. The percentage is announced via the
 * progressbar role — never relies on color alone.
 */
export default function MilestoneProgress({ percent, label = 'Milestone progress', className }) {
  const value = Math.min(100, Math.max(0, Number(percent) || 0));

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-gray-500">{label}</span>
        <span className="font-semibold text-ink-900">{value}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100"
      >
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-300"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
