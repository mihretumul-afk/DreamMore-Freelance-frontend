import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardList, PlusCircle, Eye, Edit, Trash2, XCircle, RotateCcw, ExternalLink } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/marketplace/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/marketplace/StatusBadge';
import Pagination from '../../components/marketplace/Pagination';
import Modal from '../../components/ui/Modal';
import { employerService } from '../../services/employerService';
import { normalizeJob } from '../../utils/jobMapper';
import { getErrorMessage } from '../../utils/errors';
import { formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';

export default function EmployerJobsPage() {
  usePageTitle('My Jobs');
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const statusFilter = searchParams.get('status') ?? '';

  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [acting, setActing] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      const response = await employerService.getMyJobs(params);
      if (response.success) {
        setJobs((response.data ?? []).map(normalizeJob));
        setMeta(response.meta ?? null);
      } else {
        setError(response.message || 'Unable to load your jobs.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load your jobs. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleAction = useCallback(async () => {
    if (!actionTarget || !actionType) return;
    setActing(true);
    try {
      switch (actionType) {
        case 'close':
          await employerService.closeJob(actionTarget.id);
          showToast('Job closed successfully.', 'success');
          break;
        case 'reopen':
          await employerService.reopenJob(actionTarget.id);
          showToast('Job reopened successfully.', 'success');
          break;
        case 'delete':
          await employerService.deleteJob(actionTarget.id);
          showToast('Job deleted successfully.', 'success');
          break;
        default:
          break;
      }
      setActionTarget(null);
      setActionType(null);
      loadJobs();
    } catch (err) {
      showToast(getErrorMessage(err, 'Action failed. Please try again.'), 'error');
    } finally {
      setActing(false);
    }
  }, [actionTarget, actionType, loadJobs, showToast]);

  const openAction = (job, type) => {
    setActionTarget(job);
    setActionType(type);
  };

  const goToPage = (nextPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', nextPage);
    setSearchParams(params);
  };

  const setStatusFilter = (status) => {
    const params = new URLSearchParams(searchParams);
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    params.delete('page');
    setSearchParams(params);
  };

  const totalPages = meta?.last_page ?? 1;
  const total = meta?.total ?? jobs.length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employer"
        title="My Jobs"
        description="Manage your posted jobs, review proposals, and track hiring."
        actions={
          <Button as={Link} to="/employer/jobs/create">
            <PlusCircle className="h-4 w-4" aria-hidden="true" /> Post a Job
          </Button>
        }
      />

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: '', label: 'All' },
          { value: 'open', label: 'Open' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'closed', label: 'Closed' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'border-ink-900 bg-ink-900 text-white'
                : 'border-gray-200 bg-white text-ink-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-gray-500" aria-live="polite">
          {total} job{total === 1 ? '' : 's'}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-card border border-gray-200 bg-white" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <ErrorState title="Unable to load your jobs" description={error} onRetry={loadJobs} />
      )}

      {/* Empty */}
      {!loading && !error && jobs.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No jobs yet"
          description="Post your first job to start receiving proposals from talent."
          action={
            <Button as={Link} to="/employer/jobs/create" size="sm">
              <PlusCircle className="h-4 w-4" aria-hidden="true" /> Post a Job
            </Button>
          }
        />
      )}

      {/* Jobs list */}
      {!loading && !error && jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id} className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/employer/jobs/${job.id}`}
                      className="text-base font-bold text-ink-900 transition-colors hover:text-brand-600"
                    >
                      {job.title}
                    </Link>
                    <StatusBadge status={job.status} dot />
                    {job.categoryName && <Badge tone="primary" size="xs">{job.categoryName}</Badge>}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="font-semibold text-ink-700">
                      {formatETB(job.budget)}{job.interval ? `/${job.interval}` : ''}
                    </span>
                    {job.locationLabel && <span>{job.locationLabel}</span>}
                    {job.postedAtLabel && <span>Posted {job.postedAtLabel}</span>}
                    {job.proposalsCount != null && <span>{job.proposalsCount} proposals</span>}
                  </div>
                  {job.skills?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {job.skills.slice(0, 4).map((skill) => (
                        <span key={skill.id} className="rounded-full bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-700">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button as={Link} to={`/employer/jobs/${job.id}`} variant="outline" size="xs">
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" /> View
                  </Button>
                  <Button as={Link} to={`/employer/jobs/${job.id}/proposals`} variant="outline" size="xs">
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Proposals
                  </Button>
                  {job.status === 'draft' || job.status === 'open' ? (
                    <Button as={Link} to={`/employer/jobs/${job.id}/edit`} variant="outline" size="xs">
                      <Edit className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                    </Button>
                  ) : null}
                  {job.status === 'open' && (
                    <Button variant="ghost" size="xs" onClick={() => openAction(job, 'close')}>
                      <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Close
                    </Button>
                  )}
                  {job.status === 'closed' && (
                    <Button variant="ghost" size="xs" onClick={() => openAction(job, 'reopen')}>
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reopen
                    </Button>
                  )}
                  {job.status === 'draft' && (
                    <Button variant="ghost" size="xs" onClick={() => openAction(job, 'delete')}>
                      <Trash2 className="h-3.5 w-3.5 text-danger-500" aria-hidden="true" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
      )}

      {/* Confirmation Modal */}
      <Modal
        open={Boolean(actionTarget)}
        onClose={() => { setActionTarget(null); setActionType(null); }}
        title={
          actionType === 'delete' ? 'Delete Job'
            : actionType === 'close' ? 'Close Job'
            : 'Reopen Job'
        }
        description={
          actionType === 'delete'
            ? `Are you sure you want to delete "${actionTarget?.title}"? This action cannot be undone.`
            : actionType === 'close'
            ? `Are you sure you want to close "${actionTarget?.title}"? Freelancers will no longer be able to submit proposals.`
            : `Reopen "${actionTarget?.title}" to start receiving proposals again.`
        }
        size="sm"
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => { setActionTarget(null); setActionType(null); }}>
            Cancel
          </Button>
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
    </div>
  );
}
