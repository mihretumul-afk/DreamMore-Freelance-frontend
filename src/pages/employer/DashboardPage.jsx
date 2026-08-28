import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  Briefcase,
  Building2,
  ClipboardList,
  Handshake,
  MapPin,
  Pencil,
  PlusCircle,
  Send,
  Star,
  Users,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import WalletCard from '../../components/common/WalletCard';
import Avatar from '../../components/marketplace/Avatar';
import RatingDisplay from '../../components/marketplace/RatingDisplay';
import StatusBadge from '../../components/marketplace/StatusBadge';
import Button from '../../components/ui/Button';
import { employerService } from '../../services/employerService';
import { contractService } from '../../services/contractService';
import { recommendationService } from '../../services/recommendationService';
import { normalizeEmployer } from '../../utils/employerMapper';
import { normalizeJob } from '../../utils/jobMapper';
import { normalizeContract } from '../../utils/contractMapper';
import { getErrorMessage } from '../../utils/errors';
import { formatETB } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import { cn } from '../../utils/cn';

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-40 rounded-2xl bg-gray-200" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-gray-200" />)}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-gray-200" />)}
      </div>
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, hint, color = 'brand' }) {
  const colors = {
    brand:   { bg: 'bg-brand-50',   icon: 'text-brand-600',   border: 'border-brand-100' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
    violet:  { bg: 'bg-violet-50',  icon: 'text-violet-600',  border: 'border-violet-100' },
    amber:   { bg: 'bg-amber-50',   icon: 'text-amber-600',   border: 'border-amber-100' },
  };
  const c = colors[color] ?? colors.brand;
  return (
    <div className={cn('rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg', c.border)}>
      <div className={cn('mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl', c.bg)}>
        <Icon className={cn('h-5 w-5', c.icon)} aria-hidden="true" />
      </div>
      <p className="text-2xl font-extrabold tracking-tight text-ink-900">{value ?? '—'}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-500">{label}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ── Quick action card ─────────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, description, to, color = 'brand' }) {
  const colors = {
    brand:   'bg-brand-500 hover:bg-brand-600',
    emerald: 'bg-emerald-500 hover:bg-emerald-600',
    violet:  'bg-violet-500 hover:bg-violet-600',
    amber:   'bg-amber-500 hover:bg-amber-600',
  };
  return (
    <Link
      to={to}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl text-white transition-transform group-hover:scale-110', colors[color] ?? colors.brand)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-bold text-ink-900">{label}</p>
        <p className="mt-0.5 text-xs text-gray-400">{description}</p>
      </div>
    </Link>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, viewAllTo }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-bold text-ink-900">{title}</h2>
      {viewAllTo && (
        <Link to={viewAllTo} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
          View all →
        </Link>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EmployerDashboardPage() {
  usePageTitle('Dashboard');
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, jobsRes, contractsRes] = await Promise.all([
        employerService.getMyProfile(),
        employerService.getMyJobs({ page: 1 }),
        contractService.getMyContracts(),
      ]);

      const rawJobs = Array.isArray(jobsRes.data) ? jobsRes.data : (jobsRes.data?.data ?? []);
      const rawContracts = Array.isArray(contractsRes.data)
        ? contractsRes.data
        : (contractsRes.data?.data ?? []);

      const jobs = rawJobs.map(normalizeJob);
      const contracts = rawContracts.map(normalizeContract);

      setData({
        profile: normalizeEmployer(profileRes.data),
        jobs,
        jobsTotal: jobsRes.meta?.total ?? jobsRes.data?.meta?.total ?? jobs.length,
        contracts,
      });

      recommendationService
        .getRecommendedFreelancers({ per_page: 4 })
        .then((res) => { if (res.success) setRecommendations(res.data ?? []); })
        .catch(() => {});
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load your dashboard. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (loading) return <Skeleton />;
  if (error || !data) {
    return (
      <ErrorState title="Unable to load your dashboard" description={error} onRetry={loadDashboard} />
    );
  }

  const { profile, jobs, jobsTotal, contracts } = data;
  const displayName = profile.companyName || user?.name || profile.name || 'there';
  const firstName = displayName.split(' ')[0];
  const proposalsReceived = jobs.reduce((sum, job) => sum + (job.proposalsCount ?? 0), 0);
  const activeContracts = contracts.filter((c) => c.status === 'active' || c.status === 'paused');
  const recentJobs = jobs.slice(0, 5);
  const recentContracts = contracts.slice(0, 5);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-7">

      {/* ── Welcome hero banner ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-gray-50 to-gray-100 px-6 py-7 text-gray-900 shadow-xl">
        {/* decorative circles */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-500/10" />
        <div className="pointer-events-none absolute -bottom-8 right-24 h-32 w-32 rounded-full bg-emerald-500/10" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-gray-200 bg-gray-100 shadow-lg text-xl font-extrabold">
              {(profile.companyName || user?.name || 'E').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{greeting} 👋</p>
              <h1 className="text-2xl font-extrabold tracking-tight">{firstName}</h1>
              <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">
                {profile.companyName
                  ? `${profile.companyName} · Employer`
                  : 'Employer on DreamMore'}
              </p>
            </div>
          </div>

          <Link
            to="/employer/jobs/create"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-600 hover:shadow-lg active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            Post a Job
          </Link>
        </div>
      </div>

      {/* ── Wallet balance & test withdrawal card ─────────────────────── */}
      <WalletCard userRole="employer" />

      {/* ── Stat cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label="Active jobs"
          value={jobs.filter((j) => j.status === 'open' || j.status === 'published').length}
          hint={`${jobsTotal} total posted`}
          color="brand"
        />
        <StatCard
          icon={Send}
          label="Proposals received"
          value={proposalsReceived}
          hint="Across all jobs"
          color="violet"
        />
        <StatCard
          icon={Handshake}
          label="Active contracts"
          value={activeContracts.length}
          hint="Active or paused"
          color="amber"
        />
        <StatCard
          icon={Banknote}
          label="Total spent"
          value={formatETB(profile.totalSpent ?? 0)}
          hint="Confirmed payments"
          color="emerald"
        />
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickAction icon={PlusCircle}   label="Post a Job"      description="Hire top talent"         to="/employer/jobs/create"         color="brand"   />
        <QuickAction icon={ClipboardList} label="My Jobs"        description="Manage your listings"    to="/employer/jobs"                color="violet"  />
        <QuickAction icon={Handshake}    label="Contracts"       description="Active agreements"       to="/employer/contracts"           color="emerald" />
        <QuickAction icon={Pencil}       label="Edit Profile"    description="Update company info"     to="/employer/profile/edit"        color="amber"   />
      </div>

      {/* ── 3-column bento grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Posted jobs */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <SectionHeader title="Your posted jobs" viewAllTo={jobsTotal > 0 ? '/employer/jobs' : undefined} />
          {recentJobs.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {recentJobs.map((job) => (
                <li key={job.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/employer/jobs/${job.id}`}
                      className="min-w-0 text-sm font-semibold text-ink-900 hover:text-brand-600 line-clamp-1"
                    >
                      {job.title}
                    </Link>
                    <StatusBadge status={job.status} size="xs" />
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
                    {job.proposalsCount != null && (
                      <span className="inline-flex items-center gap-1">
                        <Send className="h-3 w-3" />{job.proposalsCount} proposals
                      </span>
                    )}
                    {job.budget != null && (
                      <span>{formatETB(job.budget)}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No jobs posted yet"
              description="Post your first job to start receiving proposals from top freelancers."
              className="py-8"
              action={
                <Link
                  to="/employer/jobs/create"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-600"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Post a Job
                </Link>
              }
            />
          )}
        </div>

        {/* Active contracts */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <SectionHeader title="Contracts" viewAllTo={contracts.length > 0 ? '/employer/contracts' : undefined} />
          {recentContracts.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {recentContracts.map((contract) => (
                <li key={contract.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/employer/contracts/${contract.id}`}
                      className="min-w-0 text-sm font-semibold text-ink-900 hover:text-brand-600 line-clamp-1"
                    >
                      {contract.title}
                    </Link>
                    <StatusBadge status={contract.status} size="xs" />
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {formatETB(contract.totalAmount)}
                    {contract.createdAtLabel ? ` · ${contract.createdAtLabel}` : ''}
                  </p>
                  {contract.summary?.progressPercent != null && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${Math.min(100, Math.max(0, contract.summary.progressPercent))}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-gray-400">
                        {contract.summary.progressPercent}%
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Handshake}
              title="No contracts yet"
              description="Accept a proposal to start a contract with a freelancer."
              className="py-8"
            />
          )}
        </div>

        {/* Recommended freelancers */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <SectionHeader title="Top freelancers" viewAllTo="/freelancers" />
          {recommendations.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {recommendations.slice(0, 5).map((rec) => {
                const fl = rec.freelancer ?? rec;
                return (
                  <li key={fl.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Avatar name={fl.name} src={fl.avatar} size="sm" />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/freelancers/${fl.id}`}
                        className="block text-sm font-semibold text-ink-900 hover:text-brand-600 line-clamp-1"
                      >
                        {fl.name}
                      </Link>
                      <p className="text-xs text-gray-400 line-clamp-1">
                        {fl.headline || fl.category}
                      </p>
                    </div>
                    {fl.rating > 0 && (
                      <div className="flex shrink-0 items-center gap-1 text-xs text-gray-500">
                        <Star className="h-3 w-3 text-amber-400" />
                        {fl.rating.toFixed(1)}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={Users}
              title="No recommendations yet"
              description="Post a job to get freelancer matches tailored to your needs."
              className="py-8"
            />
          )}
        </div>
      </div>

      {/* ── Company profile strip ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-xl font-extrabold text-brand-600">
              {(profile.companyName || user?.name || 'E').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-ink-900">
                {profile.companyName || user?.name || 'Company'}
              </p>
              <p className="text-sm text-gray-500 line-clamp-1">
                {profile.companyDescription || 'No company description set'}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                {profile.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />{profile.location}
                  </span>
                )}
                {profile.industry && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />{profile.industry}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button as={Link} to="/employer/profile" variant="outline" size="sm">
              View Profile
            </Button>
            <Button as={Link} to="/employer/profile/edit" size="sm">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
