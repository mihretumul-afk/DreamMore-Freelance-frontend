import { CalendarDays, Handshake } from 'lucide-react';
import StatusBadge from '../marketplace/StatusBadge';
import { formatDate } from '../../utils/format';

/**
 * Hero card for the contract details page: job title, status, contract ID and
 * dates. Stays a quiet white card — no gradients, no extra colors.
 */
export default function ContractHeader({ contract }) {
  return (
    <div className="rounded-card border border-gray-200 bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50">
            <Handshake className="h-6 w-6 text-brand-600" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-ink-900 sm:text-xl">
                {contract.title}
              </h2>
              <StatusBadge status={contract.status} size="md" />
            </div>
            <p className="mt-1 text-xs text-gray-400">Contract #{contract.id}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-gray-100 pt-4 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          Started {formatDate(contract.startDate)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          {contract.endDate ? `Ended ${formatDate(contract.endDate)}` : 'End date not set'}
        </span>
      </div>
    </div>
  );
}
