import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  Building2,
  ClipboardList,
  Handshake,
  Layers,
  MapPin,
  Pencil,
  PlusCircle,
  Send,
  Star,
  Users,
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

export default function EmployerDashboardPage() {
  usePageTitle('Employer Dashboard');
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

      // Load recommendations (non-blocking — failures are silent).
      recommendationService
        .getRecommendedFreelancers({ per_page: 5 })
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

  const { profile, jobs, jobsTotal, contracts } = data;
  const displayName = profile.companyName || user?.name || profile.name || 'there';
  const firstName = displayName.split(' ')[0];
  const proposalsReceived = jobs.reduce((sum, job) => sum + (job.proposalsCount ?? 0), 0);
  const activeContracts = contracts.filter(
    (contract) => contract.status === 'active' || contract.status === 'paused',
  );
  const recentJobs = jobs.slice(0, 5);
  const recentContracts = contracts.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${firstName}`}
        description={
          profile.companyDescription
            ? `${profile.companyName || 'Your company'} — stay on top of hiring.`
            : 'Post a job or review proposals to keep hiring moving.'
        }
      />

      {/* Statistics — all real API data */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label="Jobs posted"
          value={jobsTotal}
          hint="Across all statuses"
        />
        <StatCard
          icon={Send}
          label="Proposals received"
          value={proposalsReceived}
          hint="On your current job listings"
        />
        <StatCard
          icon={Handshake}
          label="Active contracts"
          value={activeContracts.length}
          hint="Active or paused"
        />
        <StatCard
          icon={Banknote}
          label="Total spent"
          value={formatETB(profile.totalSpent)}
          tone="emerald"
          hint="Confirmed by your profile"
        />
      </div>

      {/* Quick actions — existing routes only */}
      <QuickActions
        className="xl:grid-cols-4"
        items={[
          {
            label: 'Post a Job',
            description: 'Publish a new opportunity',
            to: '/employer/jobs/create',
            icon: PlusCircle,
          },
          {
            label: 'Manage Jobs',
            description: 'Review listings and proposals',
            to: '/employer/jobs',
            icon: ClipboardList,
          },
          {
            label: 'Contracts',
            description: 'View active agreements',
            to: '/employer/contracts',
            icon: Handshake,
          },
          {
            label: 'Edit Profile',
            description: 'Update your company profile',
            to: '/employer/profile/edit',
            icon: Pencil,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          {/* Recommended talent */}
          <Card>
            <CardHeader
              title="Recommended talent"
              description="Freelancers matched to your job needs and saved preferences."
              action={
                recommendations.length > 0 ? (
                  <Link
                    to="/freelancers"
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
                    <li key={rec.freelancer?.id} className="py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <Link
                            to={`/freelancers/${rec.freelancer?.id}`}
                            className="block truncate text-sm font-bold text-ink-900 transition-colors hover:text-brand-600"
                          >
                            {rec.freelancer?.user?.name ?? rec.freelancer?.headline}
                          </Link>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {rec.reason}
                          </p>
                        </div>
                        <Button as={Link} to={`/freelancers/${rec.freelancer?.id}`} variant="outline" size="xs">
                          View
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No recommendations yet"
                  description="Post jobs and save freelancers to get personalized recommendations."
                  action={
                    <Button as={Link} to="/freelancers" variant="outline" size="sm">
                      <Users className="h-4 w-4" aria-hidden="true" /> Find talent
                    </Button>
                  }
                />
              )}
            </CardBody>
          </Card>

          {/* Recent jobs */}
          <Card>
            <CardHeader
              title="Recent jobs"
              description="Your latest listings, straight from the API."
              action={
                jobsTotal > 0 ? (
                  <Link
                    to="/employer/jobs"
                    className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Manage jobs
                  </Link>
                ) : undefined
              }
            />
            <CardBody>
              {recentJobs.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {recentJobs.map((job) => (
                    <li key={job.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <Link
                          to={`/employer/jobs/${job.id}`}
                          className="block truncate text-sm font-bold text-ink-900 transition-colors hover:text-brand-600"
                        >
                          {job.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {formatETB(job.budget)}
                          {job.postedAtLabel ? ` · ${job.postedAtLabel}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 text-xs text-gray-500"
                          title="Proposals received"
                        >
                          <Send className="h-3.5 w-3.5" aria-hidden="true" />
                          {job.proposalsCount ?? 0}
                        </span>
                        <StatusBadge status={job.status} size="xs" />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={ClipboardList}
                  title="You haven't posted any jobs yet"
                  description="Post your first job to start receiving proposals from talent."
                  action={
                    <Button as={Link} to="/employer/jobs/create" variant="outline" size="sm">
                      <PlusCircle className="h-4 w-4" aria-hidden="true" /> Post a job
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
                    to="/employer/contracts"
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
                            to={`/employer/contracts/${contract.id}`}
                            className="block truncate text-sm font-bold text-ink-900 transition-colors hover:text-brand-600"
                          >
                            {contract.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {contract.freelancer?.name
                              ? `${contract.freelancer.name} · `
                              : ''}
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
                  description="When you accept a proposal, the contract will appear here."
                  action={
                    <Button as={Link} to="/employer/jobs" variant="outline" size="sm">
                      <ClipboardList className="h-4 w-4" aria-hidden="true" /> Manage jobs
                    </Button>
                  }
                />
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          {/* Company summary */}
          <Card>
            <CardHeader title="Company summary" />
            <CardBody>
              <div className="flex items-center gap-3">
                <Avatar name={displayName} src={profile.avatar} size="lg" variant="brand" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink-900">{displayName}</p>
                  <p className="truncate text-xs text-gray-500">
                    {profile.industry || 'No industry set'}
                  </p>
                </div>
              </div>
              <dl className="mt-4 space-y-3 border-t border-gray-100 pt-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-1.5 text-gray-500">
                    <Layers className="h-4 w-4" aria-hidden="true" /> Industry
                  </dt>
                  <dd className="truncate text-right font-medium text-ink-900">
                    {profile.industry || '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Company size</dt>
                  <dd className="font-medium text-ink-900">{profile.companySize ?? '—'}</dd>
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
                    <Building2 className="h-4 w-4" aria-hidden="true" /> Posted jobs
                  </dt>
                  <dd className="font-medium text-ink-900">{jobsTotal}</dd>
                </div>
              </dl>
            </CardBody>
            <div className="space-y-2 border-t border-gray-100 px-5 py-4">
              <Button as={Link} to="/employer/profile" variant="outline" size="sm" className="w-full">
                View Profile
              </Button>
              <Button as={Link} to="/employer/profile/edit" size="sm" className="w-full">
                <Pencil className="h-4 w-4" aria-hidden="true" /> Edit Profile
              </Button>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
