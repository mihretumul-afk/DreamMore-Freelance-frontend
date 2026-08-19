import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, Handshake, User } from 'lucide-react';
import Card, { CardBody } from '../ui/Card';
import Button from '../ui/Button';
import StatusBadge from '../marketplace/StatusBadge';
import MilestoneProgress from './MilestoneProgress';
import { formatDate, formatETB } from '../../utils/format';

/**
 * Contract card for the contracts list page. Role-aware: the "other party"
 * and the detail link follow whether the viewer is the freelancer or employer.
 */
export default function ContractCard({ contract, role = 'freelancer' }) {
  const detailPath = `/${role}/contracts/${contract.id}`;
  const isFreelancerView = role === 'freelancer';
  const otherParty = isFreelancerView ? contract.employer : contract.freelancer;
  const otherPartyLabel = isFreelancerView ? 'Employer' : 'Freelancer';
  const progress = contract.summary?.progressPercent;
  const progressLabel =
    contract.summary?.milestonesCount != null
      ? `${contract.summary.completedMilestonesCount ?? 0} of ${contract.summary.milestonesCount} milestones`
      : 'Milestone progress';

  return (
    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover">
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={detailPath}
                className="truncate text-sm font-bold text-ink-900 transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
              >
                {contract.title}
              </Link>
              <StatusBadge status={contract.status} size="xs" />
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              <span className="inline-flex min-w-0 items-center gap-1">
                <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {otherPartyLabel}: {otherParty?.name ?? '—'}
                </span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Handshake className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Contract #{contract.id}
              </span>
            </p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-base font-extrabold text-ink-900">
              {formatETB(contract.totalAmount)}
            </p>
            {contract.budgetType && (
              <p className="text-[11px] capitalize text-gray-400">{contract.budgetType} budget</p>
            )}
          </div>
        </div>

        {progress != null && <MilestoneProgress percent={progress} label={progressLabel} />}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              Created {contract.createdAtLabel ?? formatDate(contract.createdAt)}
            </span>
            {contract.updatedAt && (
              <span>Updated {contract.updatedAtLabel ?? formatDate(contract.updatedAt)}</span>
            )}
          </p>
          <Button as={Link} to={detailPath} variant="outline" size="sm">
            View Contract
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
