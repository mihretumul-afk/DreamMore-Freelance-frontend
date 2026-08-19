import { cn } from '../../utils/cn';

/**
 * Toggleable filter chip (aria-pressed) used by future search/filter UIs.
 */
export default function FilterButton({ active = false, onClick, icon: Icon, label, count, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-brand-300 bg-brand-50 text-brand-700'
          : 'border-gray-200 bg-white text-ink-700 hover:border-gray-300 hover:bg-gray-50',
        className,
      )}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {label}
      {count != null && (
        <span className="rounded-full bg-ink-50 px-1.5 text-xs text-ink-600">{count}</span>
      )}
    </button>
  );
}
