import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Labeled select with chevron, hint, error, and required indicator support.
 */
export default function Select({ label, error, hint, required, id, className, children, ...props }) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-ink-800 dark:text-slate-200">
          {label}
          {required && (
            <span className="text-danger-500" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          required={required || undefined}
          aria-required={required || undefined}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'w-full appearance-none rounded-input border bg-white dark:bg-slate-900 px-3.5 py-2.5 pr-9 text-sm text-ink-900 dark:text-slate-100 dark:border-slate-700 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-800 disabled:text-gray-400 dark:disabled:text-slate-500',
            error
              ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20'
              : 'border-gray-300 dark:border-slate-700 focus:border-brand-500 focus:ring-brand-500/20',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
      </div>
      {error ? (
        <p role="alert" className="text-xs font-medium text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}
