import { cn } from '../../utils/cn';

/**
 * Friendly empty state for lists and sections with no data yet.
 */
export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 px-6 py-16 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-card">
          <Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
        </div>
      )}
      <h3 className="mt-4 text-base font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
