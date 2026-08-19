import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

/** Inline loading indicator with optional label. */
export function Loading({ label = 'Loading…', className }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex items-center justify-center gap-2 py-12 text-sm text-gray-500', className)}
    >
      <Loader2 className="h-5 w-5 animate-spin text-brand-500" aria-hidden="true" />
      {label}
    </div>
  );
}

/** Full-page loader used as Suspense fallback and route-guard fallback. */
export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50">
        <Loader2 className="h-5 w-5 animate-spin text-brand-500" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
    </div>
  );
}
