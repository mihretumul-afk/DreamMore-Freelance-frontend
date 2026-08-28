import { Banknote, CalendarDays, Coins, ShieldCheck, User, CheckCircle2, Clock, Lock } from 'lucide-react';
import Card, { CardHeader, CardBody } from '../ui/Card';
import { formatDate, formatETB } from '../../utils/format';

/**
 * Modernized Financial & Progress Overview Widget
 */
export default function ContractSummary({ contract, role = 'freelancer' }) {
  const isFreelancerView = role === 'freelancer';
  const otherParty = isFreelancerView ? contract.employer : contract.freelancer;
  const otherPartyLabel = isFreelancerView ? 'Employer' : 'Freelancer';

  const summary = contract.summary || {};
  const progressPercent = summary.progressPercent ?? 0;
  const totalAmount = contract.totalAmount || 0;
  const totalMilestones = summary.milestonesCount ?? (contract.milestones?.length || 0);
  const completedMilestones = summary.completedMilestonesCount ?? 0;
  const remainingAmount = summary.remainingMilestoneAmount ?? (totalAmount - (summary.completedMilestoneAmount || 0));

  return (
    <Card className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <CardHeader
        title="Financial Overview"
        description="Escrow status & milestone progress"
      />
      <CardBody className="space-y-5">
        {/* Progress meter bar */}
        <div className="space-y-2 rounded-2xl bg-slate-50 p-4 border border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-ink-900">Contract Completion</span>
            <span className="text-brand-600 font-extrabold">{progressPercent}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200/80 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-500 transition-all duration-500 shadow-sm"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-500 flex items-center justify-between pt-0.5">
            <span>{completedMilestones} of {totalMilestones} milestones completed</span>
            <span>{formatETB(summary.completedMilestoneAmount || 0)} released</span>
          </p>
        </div>

        {/* Financial Stat Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <Banknote className="h-4 w-4" /> Total Budget
            </div>
            <p className="mt-1 text-lg font-extrabold text-emerald-950">
              {formatETB(totalAmount)}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <Lock className="h-4 w-4" /> Remaining
            </div>
            <p className="mt-1 text-lg font-extrabold text-amber-950">
              {formatETB(remainingAmount)}
            </p>
          </div>
        </div>

        {/* Contract Details List */}
        <dl className="space-y-3 pt-2 text-xs border-t border-gray-100">
          <div className="flex items-center justify-between">
            <dt className="text-gray-500 flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-gray-400" />
              Payment Structure
            </dt>
            <dd className="font-semibold text-ink-900 capitalize">
              {contract.budgetType ?? 'Milestone based'} ({formatETB(contract.agreedRate)} rate)
            </dd>
          </div>

          <div className="flex items-center justify-between">
            <dt className="text-gray-500 flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
              Contract Duration
            </dt>
            <dd className="font-medium text-ink-900">
              {formatDate(contract.startDate)} → {contract.endDate ? formatDate(contract.endDate) : 'Ongoing'}
            </dd>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <dt className="text-gray-500 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-gray-400" />
              {otherPartyLabel}
            </dt>
            <dd className="font-bold text-brand-600 text-right">
              {otherParty?.name ?? '—'}
            </dd>
          </div>
        </dl>

        {/* Escrow Fee Transparency Pill */}
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-[11px] text-blue-800 flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <strong>Platform Guarantee:</strong> Milestones are held safely in internal escrow until deliverables are approved.
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
