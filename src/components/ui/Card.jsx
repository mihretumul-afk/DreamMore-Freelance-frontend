import { cn } from '../../utils/cn';

const variants = {
  default: 'border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-ink-900 dark:text-slate-100 shadow-card transition-colors',
  bordered: 'border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-ink-900 dark:text-slate-100 transition-colors',
  elevated: 'border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-ink-900 dark:text-slate-100 shadow-elevated transition-colors',
};

/**
 * Base white card. Use `interactive` for hoverable content and `as` to render
 * a different element (e.g. as={Link} to="...").
 */
export function Card({ variant = 'default', interactive = false, as, className, children, ...props }) {
  const Tag = as || 'div';
  return (
    <Tag
      className={cn(
        'rounded-card',
        variants[variant],
        interactive &&
          'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** Card header with optional title, description and action slot. */
export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 sm:gap-4 border-b border-gray-100 dark:border-slate-800 px-4 sm:px-5 py-3.5 sm:py-4', className)}>
      <div className="min-w-0 flex-1">
        {title && <h3 className="text-sm sm:text-base font-semibold text-ink-900 dark:text-slate-100 truncate">{title}</h3>}
        {description && <p className="mt-0.5 text-xs sm:text-sm text-gray-500 dark:text-slate-400">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Card body. */
export function CardBody({ className, children }) {
  return <div className={cn('px-4 sm:px-5 py-4 sm:py-5', className)}>{children}</div>;
}

/** Card footer. */
export function CardFooter({ className, children }) {
  return (
    <div className={cn('border-t border-gray-100 dark:border-slate-800 px-4 sm:px-5 py-3.5 sm:py-4', className)}>{children}</div>
  );
}

export default Card;
