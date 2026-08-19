import { Star } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Star rating. Supports fractional stars, an accessible label, and an optional
 * review count.
 */
export default function RatingDisplay({
  rating = 0,
  count,
  size = 'sm',
  showValue = true,
  className,
}) {
  const starSize = size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  const label = `Rated ${rating} out of 5${count != null ? ` from ${count} reviews` : ''}`;

  return (
    <div
      role="img"
      aria-label={label}
      className={cn('flex items-center gap-1.5', className)}
    >
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => {
          const fillPercent = Math.max(0, Math.min(100, (rating - index) * 100));
          return (
            <span key={index} className={cn('relative inline-block', starSize)}>
              <Star className={cn('absolute inset-0 text-gray-300', starSize)} fill="currentColor" />
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fillPercent}%` }}
              >
                <Star className={cn('text-amber-400', starSize)} fill="currentColor" />
              </span>
            </span>
          );
        })}
      </span>
      {showValue && (
        <span className="text-xs font-semibold text-ink-900">
          {Number(rating).toFixed(1)}
          {count != null && <span className="font-normal text-gray-400"> ({count})</span>}
        </span>
      )}
    </div>
  );
}
