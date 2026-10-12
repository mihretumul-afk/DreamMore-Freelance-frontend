import { useId } from 'react';
import { cn } from '../../utils/cn';

const fieldBase =
  'w-full rounded-input border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-ink-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-800 disabled:text-gray-400';

const stateClasses = {
  normal: 'border-gray-300 dark:border-slate-700 focus:border-brand-500 focus:ring-brand-500/20',
  error: 'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20',
};

/**
 * Labeled text input with optional leading icon, hint, error, and required
 * indicator support.
 */
export default function Input({
  label,
  error,
  hint,
  icon: Icon,
  required,
  id,
  className,
  ...props
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-800 dark:text-slate-200">
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
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
        )}
        <input
          id={inputId}
          required={required || undefined}
          aria-required={required || undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            fieldBase,
            Icon && 'pl-10',
            error ? stateClasses.error : stateClasses.normal,
            className,
          )}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-gray-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
