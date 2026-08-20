import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  CalendarDays,
  Send,
  Building2,
  Briefcase,
  GraduationCap,
  ArrowLeft,
  Compass,
  Bookmark,
} from 'lucide-react';
import Container from '../../components/common/Container';
import ErrorState from '../../components/common/ErrorState';
import Breadcrumbs from '../../components/marketplace/Breadcrumbs';
import Avatar from '../../components/marketplace/Avatar';
import SkillBadge from '../../components/marketplace/SkillBadge';
import StatusBadge from '../../components/marketplace/StatusBadge';
import PriceDisplay from '../../components/marketplace/PriceDisplay';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import JobProposalPanel from '../../components/proposals/JobProposalPanel';
import { jobService } from '../../services/jobService';
import { savedService } from '../../services/savedService';
import { useAuth } from '../../hooks/useAuth';
import { normalizeJob } from '../../utils/jobMapper';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { cn } from '../../utils/cn';

function DetailSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <div className="h-40 animate-pulse rounded-card border border-gray-200 bg-white p-6 shadow-card" />
      <div className="h-56 animate-pulse rounded-card border border-gray-200 bg-white p-6 shadow-card" />
    </div>
  );
}

export default function JobDetailsPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  usePageTitle(job ? job.title : 'Job Details');

  const checkSaved = useCallback(async () => {
    if (!user || !id) return;
    try {
      const res = await savedService.isJobSaved(id);
      if (res.success) setIsSaved(res.data.saved);
    } catch {
      // Silently ignore.
    }
  }, [user, id]);

  useEffect(() => {
    checkSaved();
  }, [checkSaved]);

  const handleToggleSave = async () => {
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    setSaving(true);
    try {
      if (isSaved) {
        await savedService.unsaveJob(id);
        setIsSaved(false);
      } else {
        await savedService.saveJob(id);
        setIsSaved(true);
      }
    } catch {
      checkSaved();
    } finally {
      setSaving(false);
    }
  };

  const loadJob = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const response = await jobService.getJob(id);
      if (response.success) {
        setJob(normalizeJob(response.data));
      } else {
        setError(response.message || 'Job not found.');
        setNotFound(true);
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setNotFound(true);
        setError('This job is no longer available or does not exist.');
      } else {
        setError(getErrorMessage(err, 'Unable to load this job right now. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  if (loading) {
    return (
      <Container className="py-8 lg:py-12">
        <DetailSkeleton />
      </Container>
    );
  }

  if (error || !job) {
    return (
      <Container className="py-8 lg:py-12">
        {notFound ? (
          <div className="flex flex-col items-center rounded-card border border-dashed border-gray-300 bg-gray-50/60 px-6 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-card">
              <Compass className="h-7 w-7 text-brand-500" aria-hidden="true" />
            </div>
            <h1 className="mt-5 text-xl font-bold text-ink-900">Job not found</h1>
            <p className="mt-2 max-w-md text-sm text-gray-500">{error}</p>
            <Button as={Link} to="/jobs" variant="outline" className="mt-6">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to jobs
            </Button>
          </div>
        ) : (
          <ErrorState title="Unable to load this job" description={error} onRetry={loadJob} />
        )}
      </Container>
    );
  }

  const budgetRange =
    job.hasRange && job.minBudget != null && job.maxBudget != null
      ? `${formatETB(job.minBudget)} – ${formatETB(job.maxBudget)}${job.interval ? '/hr' : ''}`
      : null;

  return (
    <Container className="py-8 lg:py-12">
      <Breadcrumbs
        items={[{ label: 'Home', to: '/' }, { label: 'Browse Jobs', to: '/jobs' }, { label: job.title }]}
        className="mb-4"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          {/* Header */}
          <Card className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {job.categoryName && <Badge tone="primary">{job.categoryName}</Badge>}
                <StatusBadge status={job.status} dot />
              </div>
              <button
                type="button"
                onClick={handleToggleSave}
                disabled={saving}
                aria-pressed={isSaved}
                aria-label={isSaved ? 'Remove from saved jobs' : 'Save this job'}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-500 disabled:opacity-50"
              >
                <Bookmark
                  className={cn('h-5 w-5', isSaved && 'fill-brand-500 text-brand-500')}
                  aria-hidden="true"
                />
              </button>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
              {job.title}
            </h1>
            {job.employer?.name && (
              <Link
                to={`/employers/${job.employer.id}`}
                className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-brand-600"
              >
                <Building2 className="h-4 w-4" aria-hidden="true" /> {job.employer.name}
              </Link>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
              {job.locationLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" aria-hidden="true" /> {job.locationLabel}
                </span>
              )}
              {job.postedAtLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" aria-hidden="true" /> Posted {job.postedAtLabel}
                </span>
              )}
              {job.proposalsCount != null && (
                <span className="inline-flex items-center gap-1.5">
                  <Send className="h-4 w-4" aria-hidden="true" /> {job.proposalsCount} proposals
                </span>
              )}
            </div>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader title="About this job" />
            <CardBody>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {job.description || 'No description provided.'}
              </p>
            </CardBody>
          </Card>

          {/* Skills */}
          {job.skills?.length > 0 && (
            <Card>
              <CardHeader title="Required skills" />
              <CardBody>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <SkillBadge key={skill.id}>{skill.name}</SkillBadge>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <Card>
            <CardHeader title="Budget" />
            <CardBody className="space-y-3">
              <PriceDisplay size="lg" amount={job.budget} interval={job.interval} />
              {budgetRange && <p className="text-xs text-gray-500">Range: {budgetRange}</p>}
              {job.currency && <p className="text-xs text-gray-400">Currency: {job.currency}</p>}
              {job.jobType && <Badge tone="info">{job.jobType}</Badge>}
            </CardBody>
            <CardFooter>
              <JobProposalPanel job={job} onProposalSubmitted={loadJob} />
            </CardFooter>
          </Card>

          <Card>
            <CardHeader title="Overview" />
            <CardBody>
              <dl className="space-y-3 text-sm">
                {job.jobType && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="flex items-center gap-2 text-gray-500">
                      <Briefcase className="h-4 w-4" aria-hidden="true" /> Job type
                    </dt>
                    <dd className="font-medium text-ink-900">{job.jobType}</dd>
                  </div>
                )}
                {job.experienceLevel && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="flex items-center gap-2 text-gray-500">
                      <GraduationCap className="h-4 w-4" aria-hidden="true" /> Experience
                    </dt>
                    <dd className="font-medium text-ink-900">{job.experienceLevel}</dd>
                  </div>
                )}
                {job.locationTypeLabel && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="flex items-center gap-2 text-gray-500">
                      <MapPin className="h-4 w-4" aria-hidden="true" /> Work mode
                    </dt>
                    <dd className="font-medium text-ink-900">{job.locationTypeLabel}</dd>
                  </div>
                )}
                {job.locationLabel && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="flex items-center gap-2 text-gray-500">Location</dt>
                    <dd className="text-right font-medium text-ink-900">{job.locationLabel}</dd>
                  </div>
                )}
                {job.publishedAt && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="flex items-center gap-2 text-gray-500">
                      <Clock className="h-4 w-4" aria-hidden="true" /> Posted
                    </dt>
                    <dd className="font-medium text-ink-900">{formatDate(job.publishedAt)}</dd>
                  </div>
                )}
                {job.deadline && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="flex items-center gap-2 text-gray-500">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" /> Deadline
                    </dt>
                    <dd className="font-medium text-ink-900">{formatDate(job.deadline)}</dd>
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>

          {job.employer && (
            <Card>
              <CardHeader title="Employer" />
              <CardBody>
                <Link
                  to={`/employers/${job.employer.id}`}
                  className="group flex items-center gap-3"
                >
                  <Avatar name={job.employer.name} size="md" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink-900 transition-colors group-hover:text-brand-600">
                      {job.employer.name}
                    </span>
                    <span className="text-xs text-gray-500">View company profile</span>
                  </span>
                </Link>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
}
