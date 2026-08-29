import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Banknote,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  FolderOpen,
  MapPin,
  Pencil,
  Send,
  Star,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Avatar from '../../components/marketplace/Avatar';
import RatingDisplay from '../../components/marketplace/RatingDisplay';
import StatusBadge from '../../components/marketplace/StatusBadge';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { freelancerService } from '../../services/freelancerService';
import { proposalService } from '../../services/proposalService';
import { recommendationService } from '../../services/recommendationService';
import { normalizeFreelancer } from '../../utils/freelancerMapper';
import { normalizeProposal } from '../../utils/proposalMapper';
import { getErrorMessage } from '../../utils/errors';
import { formatETB } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import { cn } from '../../utils/cn';

// ── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-40 rounded-2xl bg-gray-200" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-gray-200" />)}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-gray-200" />)}
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
export default function FreelancerDashboardPage() {
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
      const [profileRes, proposalsRes] = await Promise.all([
        freelancerService.getMyProfile(),
        proposalService.getMyProposals({ page: 1 }),
      ]);

      const rawProposals = Array.isArray(proposalsRes.data)
        ? proposalsRes.data
        : (proposalsRes.data?.data ?? []);

      const proposals = rawProposals.map(normalizeProposal);

      setData({
        profile: normalizeFreelancer(profileRes.data),
        proposals,
        proposalsTotal: proposalsRes.meta?.total ?? proposalsRes.data?.meta?.total ?? proposals.length,
      });

      recommendationService
        .getRecommendedJobs({ per_page: 5 })
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

  const { profile, proposals, proposalsTotal } = data;
  const firstName = (user?.name || profile?.name || 'there').split(' ')[0];
  const recentProposals = proposals.slice(0, 5);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-7">

      {/* ── Welcome hero banner ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-gray-50 to-gray-100 px-6 py-7 text-gray-900 shadow-xl">
        {/* decorative circles */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-500/10" />
        <div className="pointer-events-none absolute -bottom-8 right-20 h-32 w-32 rounded-full bg-violet-500/10" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-gray-200 bg-gray-100 shadow-lg">
              {profile.avatar
                ? <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-extrabold text-gray-700">
                    {(profile.name || firstName).charAt(0).toUpperCase()}
                  </div>
                )
              }
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{greeting} 👋</p>
              <h1 className="text-2xl font-extrabold tracking-tight">{firstName}</h1>
              <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">
                {profile.headline || 'Freelancer on DreamMore'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {profile.rating > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-2 text-sm">
                <Star className="h-4 w-4 text-amber-400" />
                <span className="font-bold">{profile.rating.toFixed(1)}</span>
              </div>
            )}
            <Link
              to="/freelancer/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-600 hover:shadow-lg active:scale-95"
            >
              <Briefcase className="h-4 w-4" />
              Find Jobs
            </Link>
          </div>
        </div>

        {/* ── Approval / credential status banners ──────────────── */}
        {(() => {
          const isFullyApproved = user?.is_fully_approved ?? false;
          const verificationStatus =
            (isFullyApproved ? 'approved' : null) ||
            user?.verification_status ||
            profile.approvalStatus;

          if (verificationStatus === 'approved' || isFullyApproved) return null;

          if (verificationStatus === 'pending') {
            return (
              <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-amber-400/30 bg-amber-500/15 px-4 py-3">
                <Clock className="h-4 w-4 shrink-0 text-amber-300" />
                <p className="text-sm text-amber-200">
                  <span className="font-bold">Under review —</span>{' '}
                  Your credentials have been submitted and are awaiting admin approval. You&apos;ll be notified once reviewed.
                </p>
              </div>
            );
          }

          if (verificationStatus === 'rejected') {
            return (
              <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-3">
                <XCircle className="h-4 w-4 shrink-0 text-red-300" />
                <p className="text-sm text-red-200">
                  <span className="font-bold">Credentials rejected.</span>{' '}
                  {profile.rejectionReason ? `Reason: ${profile.rejectionReason}. ` : ''}
                  Please update and resubmit your credentials.
                </p>
              </div>
            );
          }

          return (
            <div className="mt-5 flex flex-col gap-4 rounded-xl border border-amber-400/30 bg-amber-500/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5">
                <Award className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <div>
                  <p className="text-sm font-bold text-amber-200">Credential verification required</p>
                  <p className="mt-0.5 text-xs text-amber-300">
                    Submit your certificates so an admin can approve you to start applying for jobs.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-amber-300/80">
                    <span className="font-semibold text-emerald-400">✅ Registered</span>
                    <span>→</span>
                    <span className={profile.headline ? 'font-semibold text-emerald-400' : 'font-semibold text-amber-300'}>
                      {profile.headline ? '✅' : '⏳'} Profile
                    </span>
                    <span>→</span>
                    <span className="font-semibold text-amber-300">⏳ Credentials</span>
                    <span>→</span>
                    <span>Admin Approval</span>
                    <span>→</span>
                    <span>🚀 Apply!</span>
                  </div>
                </div>
              </div>
              <Link
                to="/freelancer/credentials"
                className="shrink-0 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-amber-600"
              >
                Submit Credentials
              </Link>
            </div>
          );
        })()}
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon={Send}
          label="Proposals sent"
          value={proposalsTotal}
          hint="Total submitted"
          color="brand"
        />
        <StatCard
          icon={ClipboardList}
          label="Jobs completed"
          value={profile.completedJobsCount}
          hint="Total completed"
          color="amber"
        />
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickAction icon={Briefcase}   label="Find Jobs"      description="Browse openings"       to="/freelancer/jobs"          color="brand"   />
        <QuickAction icon={FileText}    label="My Proposals"   description="Track submissions"     to="/freelancer/proposals"     color="violet"  />
        <QuickAction icon={Pencil}      label="Edit Profile"   description="Update public page"    to="/freelancer/profile/edit"  color="amber"   />
      </div>

      {/* ── Main 2-column bento ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Recommended jobs */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <SectionHeader title="Recommended for you" viewAllTo="/freelancer/jobs" />
          {recommendations.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {recommendations.slice(0, 5).map((rec) => (
                <li key={rec.job?.id} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    to={`/jobs/${rec.job?.id}`}
                    className="block text-sm font-semibold text-ink-900 transition-colors hover:text-brand-600 line-clamp-1"
                  >
                    {rec.job?.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{rec.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No recommendations"
              description="Complete your profile to get personalized job matches."
              className="py-8" />
          )}
        </div>

        {/* Recent proposals */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <SectionHeader title="Recent proposals" viewAllTo={proposalsTotal > 0 ? '/freelancer/proposals' : undefined} />
          {recentProposals.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {recentProposals.map((proposal) => (
                <li key={proposal.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link
                      to={`/freelancer/proposals/${proposal.id}`}
                      className="block text-sm font-semibold text-ink-900 hover:text-brand-600 line-clamp-1"
                    >
                      {proposal.jobTitle ?? `Proposal #${proposal.id}`}
                    </Link>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatETB(proposal.bidAmount)}
                      {proposal.createdAtLabel ? ` · ${proposal.createdAtLabel}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={proposal.status} size="xs" />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Send}
              title="No proposals yet"
              description="Apply to jobs to see your proposals here."
              className="py-8" />
          )}
        </div>
      </div>

      {/* ── Profile summary strip ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={profile.name} src={profile.avatar} size="lg" variant="brand" />
            <div>
              <p className="font-bold text-ink-900">{profile.name ?? 'Freelancer'}</p>
              <p className="text-sm text-gray-500">{profile.headline || 'No headline set'}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                {profile.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />{profile.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <FolderOpen className="h-3.5 w-3.5" />{profile.skills.length} skills
                </span>
                {profile.rating > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-400" />
                    {profile.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button as={Link} to="/freelancer/profile" variant="outline" size="sm">
              View Profile
            </Button>
            <Button as={Link} to="/freelancer/profile/edit" size="sm">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}

