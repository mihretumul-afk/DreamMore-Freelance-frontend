import { CalendarDays, Handshake, ShieldCheck, User, ArrowRight, Zap, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import StatusBadge from '../marketplace/StatusBadge';
import Avatar from '../marketplace/Avatar';
import { formatDate, formatETB } from '../../utils/format';

/**
 * Modern Hero Card for Contract Details Page
 * Features dual participant avatars, animated status glow, escrow guarantee badge, and key metrics.
 */
export default function ContractHeader({ contract, role = 'freelancer' }) {
  const isFreelancer = role === 'freelancer';
  const employer = contract.employer;
  const freelancer = contract.freelancer;

  const isCompleted = contract.status === 'completed';
  const isActive = contract.status === 'active';
  const isDisputed = contract.status === 'disputed';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 text-ink-900 shadow-2xl sm:p-8 border border-gray-100">
      {/* Decorative ambient background glows */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Top row: Header title & status badge */}
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 border border-brand-100">
              <Handshake className="h-3.5 w-3.5 text-brand-500" />
              Contract #{contract.id}
            </span>
            <div className="relative">
              <StatusBadge status={contract.status} size="md" />
              {isActive && (
                <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              )}
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
            {contract.title}
          </h1>
        </div>

        {/* Escrow Guarantee Pill */}
        <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-700">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-emerald-800">Escrow Protected</p>
            <p className="text-[10px] text-emerald-600">Funds held safely until release</p>
          </div>
        </div>
      </div>

      {/* Middle row: Participants Card */}
      <div className="relative mt-6 grid grid-cols-1 gap-4 rounded-2xl bg-white p-4 border border-gray-100 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
        {/* Employer Info */}
        <div className="flex items-center gap-3">
          <Avatar name={employer?.name ?? 'Employer'} src={employer?.avatar} size="md" variant="brand" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Employer</p>
            <p className="truncate text-sm font-bold text-ink-900">{employer?.name ?? '—'}</p>
            {employer?.email && (
              <p className="truncate text-xs text-gray-500">{employer.email}</p>
            )}
          </div>
        </div>

        {/* Freelancer Info */}
        <div className="flex items-center gap-3">
          <Avatar name={freelancer?.name ?? 'Freelancer'} src={freelancer?.avatar} size="md" variant="success" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Freelancer</p>
            <p className="truncate text-sm font-bold text-ink-900">{freelancer?.name ?? '—'}</p>
            {freelancer?.email && (
              <p className="truncate text-xs text-gray-500">{freelancer.email}</p>
            )}
          </div>
        </div>

        {/* Contract Budget */}
        <div className="flex items-center justify-between sm:col-span-2 lg:col-span-1 lg:justify-end border-t border-gray-100 lg:border-t-0 pt-3 lg:pt-0">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider lg:text-right">Total Contract Budget</p>
            <p className="text-xl font-extrabold text-emerald-600 lg:text-right">
              {formatETB(contract.totalAmount)}
            </p>
            <p className="text-[10px] text-gray-500 capitalize lg:text-right">
              {contract.budgetType ?? 'fixed'} budget
            </p>
          </div>
        </div>
      </div>

      {/* Bottom row: Timeline Dates */}
      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600 pt-2 border-t border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <CalendarDays className="h-3.5 w-3.5 text-brand-500" />
            Started: <strong className="text-ink-900">{formatDate(contract.startDate)}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
            End Date: <strong className="text-ink-900">{contract.endDate ? formatDate(contract.endDate) : 'Active / Ongoing'}</strong>
          </span>
        </div>

        {contract.job?.title && (
          <span className="text-[11px] text-gray-500">
            Job: <strong className="text-ink-700">{contract.job.title}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
