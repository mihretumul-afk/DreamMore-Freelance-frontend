import { Banknote, CalendarDays, Coins, User } from 'lucide-react';
import Card, { CardHeader, CardBody } from '../ui/Card';
import { formatDate, formatETB } from '../../utils/format';

/**
 * Financial + party overview card for the contract details page. Only renders
 * fields the backend actually returns; unknown values show a quiet dash.
 */
export default function ContractSummary({ contract, role = 'freelancer' }) {
  const isFreelancerView = role === 'freelancer';
  const otherParty = isFreelancerView ? contract.employer : contract.freelancer;
  const otherPartyLabel = isFreelancerView ? 'Employer' : 'Freelancer';

  const rows = [
    {
      key: 'amount',
      icon: Banknote,
      label: 'Contract amount',
      value: formatETB(contract.totalAmount),
      strong: true,
    },
    {
      key: 'rate',
      icon: Coins,
      label: contract.budgetType === 'hourly' ? 'Agreed rate' : 'Agreed price',
      value: formatETB(contract.agreedRate),
    },
    {
      key: 'start',
      icon: CalendarDays,
      label: 'Start date',
      value: formatDate(contract.startDate),
    },
    {
      key: 'end',
      icon: CalendarDays,
      label: 'End date',
      value: formatDate(contract.endDate),
    },
  ];

  return (
    <Card>
      <CardHeader title="Overview" />
      <CardBody className="space-y-4">
        <dl className="space-y-3.5 text-sm">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-1.5 text-gray-500">
                <row.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {row.label}
              </dt>
              <dd className={row.strong ? 'text-base font-extrabold text-ink-900' : 'text-right font-medium text-ink-900'}>
                {row.value}
              </dd>
            </div>
          ))}
          <div className="flex items-start justify-between gap-4 border-t border-gray-100 pt-3.5">
            <dt className="flex items-center gap-1.5 text-gray-500">
              <User className="h-4 w-4 shrink-0" aria-hidden="true" />
              {otherPartyLabel}
            </dt>
            <dd className="min-w-0 text-right">
              <p className="truncate font-medium text-ink-900">
                {otherParty?.name ?? '—'}
              </p>
              {otherParty?.email && (
                <p className="truncate text-xs text-gray-400">{otherParty.email}</p>
              )}
            </dd>
          </div>
        </dl>

        {contract.summary && (
          <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
            <div className="rounded-xl bg-gray-50 px-3.5 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Milestones total
              </p>
              <p className="mt-0.5 text-sm font-bold text-ink-900">
                {formatETB(contract.summary.totalMilestoneAmount)}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 px-3.5 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Remaining
              </p>
              <p className="mt-0.5 text-sm font-bold text-ink-900">
                {formatETB(contract.summary.remainingMilestoneAmount)}
              </p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
