import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Banknote,
  Briefcase,
  ClipboardList,
  FileText,
  FolderOpen,
  Handshake,
  MapPin,
  Pencil,
  Send,
  Star,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/marketplace/PageHeader';
import Avatar from '../../components/marketplace/Avatar';
import RatingDisplay from '../../components/marketplace/RatingDisplay';
import StatusBadge from '../../components/marketplace/StatusBadge';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatCard from '../../components/dashboard/StatCard';
import QuickActions from '../../components/dashboard/QuickActions';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';
import { freelancerService } from '../../services/freelancerService';
import { proposalService } from '../../services/proposalService';
import { contractService } from '../../services/contractService';
import { recommendationService } from '../../services/recommendationService';
import { normalizeFreelancer } from '../../utils/freelancerMapper';
import { normalizeProposal } from '../../utils/proposalMapper';
import { normalizeContract } from '../../utils/contractMapper';
import { getErrorMessage } from '../../utils/errors';
import { formatETB } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function FreelancerDashboardPage() {
  usePageTitle('Freelancer Dashboard');
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, proposalsRes, contractsRes] = await Promise.all([
        freelancerService.getMyProfile(),
        proposalService.getMyProposals({ page: 1 }),
        contractService.getMyContracts(),
      ]);

      const rawProposals = Array.isArray(proposalsRes.data)
        ? proposalsRes.data
        : (proposalsRes.data?.data ?? []);
      const rawContracts = Array.isArray(contractsRes.data)
        ? contractsRes.data
        : (contractsRes.data?.data ?? []);

      const proposals = rawProposals.map(normalizeProposal);
      const contracts = rawContracts.map(normalizeContract);

      setData({
        profile: normalizeFreelancer(profileRes.data),
        proposals,
        proposalsTotal: proposalsRes.meta?.total ?? proposalsRes.data?.meta?.total ?? proposals.length,
        contracts,
      });

      // Load recommendations (non-blocking — failures are silent).
      recommendationService
        .getRecommendedJobs({ per_page: 5 })
        .then((res) => {
          if (res.success) setRecommendations(res.data ?? []);
        })
        .catch(() => {});
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load your dashboard. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <ErrorState
        title="Unable to load your dashboard"
        description={error}
        onRetry={loadDashboard}
      />
    );
  }

  const { profile, proposals, proposalsTotal, contracts } = data;
  const firstName = (user?.name || profile?.name || 'there').split(' ')[0];
  const activeContracts = contracts.filter(
    (contract) => contract.status === 'active' || contract.status === 'paused',
  );
  const recentProposals = proposals.slice(0, 5);
  const recentContracts = contracts.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${firstName}`}
        description={
          profile.headline || 'Ready to find your next project? Browse open jobs to get started.'
        }
      />

      {/* Mandatory Verification Banner */}
      {!(user?.is_verified ?? user?.has_approved_credentials) && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50/80 to-orange-50/50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-xs">
                <Award className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink-900">
                  Mandatory Credential Verification
                </h3>
                <p className="mt-0.5 text-xs text-ink-700 leading-relaxed">
                  Your credentials must be approved by an administrator before you can apply for jobs. Submit your certificates or verification documents to start bidding.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-gray-500">
                  <span className="text-emerald-700 font-semibold">1. Register ✅</span>
                  <span>→</span>
                  <span className={profile.headline ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                    2. Complete Profile {profile.headline ? '✅' : '⏳'}
                  </span>
                  <span>→</span>
                  <span className="text-amber-800 font-semibold">3. Submit Credentials ⏳</span>
                  <span>→</span>
                  <span>4. Admin Approval</span>
                  <span>→</span>
                  <span>5. Apply for Jobs 🚀</span>
                </div>
              </div>
            </div>
            <Button
              as={Link}
              to="/freelancer/credentials"
              size="sm"
              className="shrink-0"
            >
              <Award className="h-4 w-4" aria-hidden="true" /> Manage Credentials
            </Button>
          </div>
        </Card>
      )}

      {/* Statistics — all real API data */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={Send}
          label="Proposals"
          value={proposalsTotal}
          hint="Submitted to jobs"
        />
        <StatCard
          icon={Handshake}
          label="Active contracts"
          value={activeContracts.length}
          hint="Active or paused"
        />
        <StatCard
          icon={ClipboardList}
          label="Jobs completed"
          value={profile.completedJobsCount}
          hint="Across all contracts"
        />
        <StatCard
          icon={Banknote}
          label="Total earnings"
          value={formatETB(profile.totalEarnings)}
          tone="emerald"
          hint="Confirmed by your profile"
        />
      </div>

      {/* Quick actions — existing routes only */}
      <QuickActions
        className="xl:grid-cols-4"
        items={[
          {
            label: 'Find Jobs',
            description: 'Browse open opportunities',
            to: '/freelancer/jobs',
            icon: Briefcase,
          },
          {
            label: 'My Proposals',
            description: 'Track your submissions',
            to: '/freelancer/proposals',
            icon: FileText,
          },
          {
            label: 'Contracts',
            description: 'View active agreements',
            to: '/freelancer/contracts',
            icon: Handshake,
          },
          {
            label: 'Edit Profile',
            description: 'Update your public profile',
            to: '/freelancer/profile/edit',
            icon: Pencil,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          {/* Recommended jobs */}
          <Card>
            <CardHeader
              title="Recommended for you"
              description="Jobs matched to your skills, experience, and saved interests."
              action={
                recommendations.length > 0 ? (
                  <Link
                    to="/freelancer/jobs"
                    className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                  >
                    View all
                  </Link>
                ) : undefined
              }
            />
            <CardBody>
              {recommendations.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {recommendations.map((rec) => (
                    <li key={rec.job?.id ?? rec.job?.slug} className="py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <Link
                            to={`/jobs/${rec.job?.id}`}
                            className="block truncate text-sm font-bold text-ink-900 transition-colors hover:text-brand-600"
                          >
                            {rec.job?.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {rec.reason}
                          </p>
                        </div>
                        <Button as={Link} to={`/jobs/${rec.job?.id}`} variant="outline" size="xs">
                          View
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={Briefcase}
                  title="No recommendations yet"
                  description="Complete your profile and save jobs to get personalized recommendations."
                  action={
                    <Button as={Link} to="/freelancer/jobs" variant="outline" size="sm">
                      <Briefcase className="h-4 w-4" aria-hidden="true" /> Browse jobs
                    </Button>
                  }
                />
              )}
            </CardBody>
          </Card>

          {/* Recent proposals */}
          <Card>
            <CardHeader
              title="Recent proposals"
              description="Your latest submissions, straight from the API."
              action={
                proposalsTotal > 0 ? (
                  <Link
                    to="/freelancer/proposals"
                    className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                  >
                    View all
                  </Link>
                ) : undefined
              }
            />
            <CardBody>
              {recentProposals.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {recentProposals.map((proposal) => (
                    <li key={proposal.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <Link
                          to={`/freelancer/proposals/${proposal.id}`}
                          className="block truncate text-sm font-bold text-ink-900 transition-colors hover:text-brand-600"
                        >
                          {proposal.jobTitle ?? `Proposal #${proposal.id}`}
                        </Link>
                        <p className="mt-0.5 text-xs text-gray-500">
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
                  title="You haven't submitted any proposals yet"
                  description="When you apply to jobs, your proposals will appear here."
                  action={
                    <Button as={Link} to="/freelancer/jobs" variant="outline" size="sm">
                      <Briefcase className="h-4 w-4" aria-hidden="true" /> Find jobs
                    </Button>
                  }
                />
              )}
            </CardBody>
          </Card>

          {/* Recent contracts */}
          <Card>
            <CardHeader
              title="Recent contracts"
              description="Your latest agreements, straight from the API."
              action={
                contracts.length > 0 ? (
                  <Link
                    to="/freelancer/contracts"
                    className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                  >
                    View all
                  </Link>
                ) : undefined
              }
            />
            <CardBody>
              {recentContracts.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {recentContracts.map((contract) => (
                    <li key={contract.id} className="py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <Link
                            to={`/freelancer/contracts/${contract.id}`}
                            className="block truncate text-sm font-bold text-ink-900 transition-colors hover:text-brand-600"
                          >
                            {contract.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {formatETB(contract.totalAmount)}
                            {contract.createdAtLabel ? ` · ${contract.createdAtLabel}` : ''}
                          </p>
                        </div>
                        <StatusBadge status={contract.status} size="xs" />
                      </div>
                      {contract.summary?.progressPercent != null && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{ width: `${Math.min(100, Math.max(0, contract.summary.progressPercent))}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-gray-500">
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
                  description="Once an employer accepts your proposal, the contract will appear here."
                  action={
                    <Button as={Link} to="/freelancer/jobs" variant="outline" size="sm">
                      <Briefcase className="h-4 w-4" aria-hidden="true" /> Find jobs
                    </Button>
                  }
                />
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          {/* Profile summary */}
          <Card>
            <CardHeader title="Profile summary" />
            <CardBody>
              <div className="flex items-center gap-3">
                <Avatar name={profile.name} src={profile.avatar} size="lg" variant="brand" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink-900">
                    {profile.name ?? 'Freelancer'}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {profile.headline || 'No headline set'}
                  </p>
                </div>
              </div>
              <dl className="mt-4 space-y-3 border-t border-gray-100 pt-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Availability</dt>
                  <dd>
                    <StatusBadge status={profile.availability} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Hourly rate</dt>
                  <dd className="font-semibold text-ink-900">
                    {profile.hourlyRate != null && profile.hourlyRate > 0
                      ? `${formatETB(profile.hourlyRate)}/hr`
                      : 'Not set'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Rating</dt>
                  <dd>
                    {profile.rating > 0 ? (
                      <RatingDisplay rating={profile.rating} showValue />
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <Star className="h-3.5 w-3.5" aria-hidden="true" /> No ratings yet
                      </span>
                    )}
                  </dd>
                </div>
                {profile.location && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="flex items-center gap-1.5 text-gray-500">
                      <MapPin className="h-4 w-4" aria-hidden="true" /> Location
                    </dt>
                    <dd className="truncate text-right font-medium text-ink-900">
                      {profile.location}
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-1.5 text-gray-500">
                    <FolderOpen className="h-4 w-4" aria-hidden="true" /> Skills
                  </dt>
                  <dd className="text-right font-medium text-ink-900">
                    {profile.skills.length}
                  </dd>
                </div>
              </dl>
            </CardBody>
            <div className="space-y-2 border-t border-gray-100 px-5 py-4">
              <Button as={Link} to="/freelancer/profile" variant="outline" size="sm" className="w-full">
                View Profile
              </Button>
              <Button as={Link} to="/freelancer/profile/edit" size="sm" className="w-full">
                <Pencil className="h-4 w-4" aria-hidden="true" /> Edit Profile
              </Button>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
