import Card from '../ui/Card';
import { cn } from '../../utils/cn';

/**
 * Dashboard statistic card. Values are always real API data — never invented.
 * @param {{ icon: Function, label: string, value: string|number, hint?: string, tone?: 'brand'|'ink'|'emerald' }}
 */
export default function StatCard({ icon: Icon, label, value, hint, tone = 'ink', className }) {
  const valueColor =
    tone === 'brand' ? 'text-brand-500' : tone === 'emerald' ? 'text-emerald-600' : 'text-ink-900';

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />}
      </div>
      <p className={cn('mt-2 text-2xl font-extrabold tracking-tight', valueColor)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </Card>
  );
}
