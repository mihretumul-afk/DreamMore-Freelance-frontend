import { cn } from '../../utils/cn';

const tones = {
  primary: 'border-brand-200 bg-brand-50 text-brand-700',
  neutral: 'border-gray-200 bg-gray-100 text-gray-700',
  success: 'border-success-200 bg-success-50 text-success-700',
  warning: 'border-warning-200 bg-warning-50 text-warning-700',
  danger: 'border-danger-200 bg-danger-50 text-danger-700',
  info: 'border-info-200 bg-info-50 text-info-700',
};

const sizes = {
  xs: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-0.5 text-xs',
};

/**
 * Small pill badge with tone variants and an optional status dot.
 */
export default function Badge({ tone = 'neutral', size = 'md', dot = false, className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-semibold',
        tones[tone],
        sizes[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
