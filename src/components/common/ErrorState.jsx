import { AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from '../ui/Button';

/**
 * Error state with an optional retry button.
 */
export default function ErrorState({ title = 'Something went wrong', description, onRetry, className }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 px-6 py-16 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-card">
        <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-600">{description}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-5">
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
        </Button>
      )}
    </div>
  );
}
