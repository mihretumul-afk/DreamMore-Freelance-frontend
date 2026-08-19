import { cn } from '../../utils/cn';
import { formatETB } from '../../utils/format';

/**
 * Displays an amount in Ethiopian Birr with an optional interval suffix
 * (e.g. "/hr", "/month") and a compact or large size.
 */
export default function PriceDisplay({ amount, interval, size = 'md', className }) {
  return (
    <span
      className={cn(
        'font-bold text-ink-900',
        size === 'lg' ? 'text-lg' : 'text-sm',
        className,
      )}
    >
      {formatETB(amount)}
      {interval && (
        <span className="text-xs font-medium text-gray-500">/{interval}</span>
      )}
    </span>
  );
}
