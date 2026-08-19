import { cn } from '../../utils/cn';

const variants = {
  default: 'border border-gray-200 bg-white shadow-card',
  bordered: 'border border-gray-200 bg-white',
  elevated: 'border border-gray-100 bg-white shadow-elevated',
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
          'transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover',
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
    <div className={cn('flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4', className)}>
      <div>
        {title && <h3 className="text-base font-semibold text-ink-900">{title}</h3>}
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Card body. */
export function CardBody({ className, children }) {
  return <div className={cn('px-5 py-5', className)}>{children}</div>;
}

/** Card footer. */
export function CardFooter({ className, children }) {
  return (
    <div className={cn('border-t border-gray-100 px-5 py-4', className)}>{children}</div>
  );
}

export default Card;
