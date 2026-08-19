import Breadcrumbs from './Breadcrumbs';
import { cn } from '../../utils/cn';

/**
 * Standard page header used across all pages for a consistent hierarchy.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs,
  className,
}) {
  return (
    <div className={cn('mb-8', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} className="mb-4" />
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-widest text-brand-500">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-gray-500 sm:text-base">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
