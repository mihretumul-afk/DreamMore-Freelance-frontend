import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Edit, XCircle, RotateCcw, Trash2, Send, CalendarDays,
  MapPin, Clock, Briefcase, GraduationCap, ExternalLink,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import Container from '../../components/common/Container';
import Breadcrumbs from '../../components/marketplace/Breadcrumbs';
import SkillBadge from '../../components/marketplace/SkillBadge';
import StatusBadge from '../../components/marketplace/StatusBadge';
import PriceDisplay from '../../components/marketplace/PriceDisplay';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { employerService } from '../../services/employerService';
import { normalizeJob } from '../../utils/jobMapper';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function EmployerJobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [acting, setActing] = useState(false);

  usePageTitle(job ? job.title : 'Job Details');

  const loadJob = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await employerService.getJob(id);
      if (response.success) {
        setJob(normalizeJob(response.data));
      } else {
        setError(response.message || 'Unable to load job details.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load job details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const handleAction = useCallback(async () => {
    if (!actionType) return;
    setActing(true);
    try {
      switch (actionType) {
        case 'close':
          await employerService.closeJob(id);
          break;
        case 'reopen':
          await employerService.reopenJob(id);
          break;
        case 'delete':
          await employerService.deleteJob(id);
          navigate('/employer/jobs', { replace: true });
          return;
        default:
          break;
      }
      setActionType(null);
      loadJob();
    } catch {
      // non-critical
    } finally {
      setActing(false);
    }
  }, [actionType, id, loadJob, navigate]);

  if (loading) {
    return (
      <Container className="py-8 lg:py-12">
        <div className="space-y-6">
          <div className="h-40 animate-pulse rounded-card border border-gray-200 bg-white p-6 shadow-card" />
          <div className="h-56 animate-pulse rounded-card border border-gray-200 bg-white p-6 shadow-card" />
        </div>
      </Container>
    );
  }

  if (error || !job) {
    return (
      <Container className="py-8 lg:py-12">
        <ErrorState title="Unable to load job" description={error} onRetry={loadJob} />
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
        items={[
          { label: 'Dashboard', to: '/employer/dashboard' },
          { label: 'My Jobs', to: '/employer/jobs' },
          { label: job.title },
        ]}
        className="mb-4"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          {/* Header */}
          <Card className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={job.status} dot />
                {job.categoryName && <Badge tone="primary">{job.categoryName}</Badge>}
              </div>
              <div className="flex flex-wrap gap-2">
                {job.status === 'draft' || job.status === 'open' ? (
                  <Button as={Link} to={`/employer/jobs/${job.id}/edit`} variant="outline" size="sm">
                    <Edit className="h-4 w-4" aria-hidden="true" /> Edit
                  </Button>
                ) : null}
                <Button as={Link} to={`/employer/jobs/${job.id}/proposals`} variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" /> Proposals
                </Button>
              </div>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
              {job.title}
            </h1>
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

          {/* Status actions */}
          <Card>
            <CardHeader title="Actions" />
            <CardBody className="space-y-2">
              {job.status === 'open' && (
                <Button variant="outline" className="w-full" size="sm" onClick={() => setActionType('close')}>
                  <XCircle className="h-4 w-4" aria-hidden="true" /> Close Job
                </Button>
              )}
              {job.status === 'closed' && (
                <Button variant="outline" className="w-full" size="sm" onClick={() => setActionType('reopen')}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reopen Job
                </Button>
              )}
              {job.status === 'draft' && (
                <Button variant="danger" className="w-full" size="sm" onClick={() => setActionType('delete')}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete Draft
                </Button>
              )}
              <Button as={Link} to={`/employer/jobs/${job.id}/proposals`} variant="outline" className="w-full" size="sm">
                <Send className="h-4 w-4" aria-hidden="true" /> View Proposals
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        open={Boolean(actionType)}
        onClose={() => setActionType(null)}
        title={
          actionType === 'delete' ? 'Delete Job'
            : actionType === 'close' ? 'Close Job'
            : 'Reopen Job'
        }
        description={
          actionType === 'delete'
            ? 'This will permanently delete the job draft. This action cannot be undone.'
            : actionType === 'close'
            ? 'Freelancers will no longer be able to submit proposals to this job.'
            : 'The job will reopen and freelancers can submit proposals again.'
        }
        size="sm"
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setActionType(null)}>Cancel</Button>
          <Button
            variant={actionType === 'delete' ? 'danger' : 'primary'}
            size="sm"
            loading={acting}
            onClick={handleAction}
          >
            {actionType === 'delete' ? 'Delete' : actionType === 'close' ? 'Close' : 'Reopen'}
          </Button>
        </div>
      </Modal>
    </Container>
  );
}
