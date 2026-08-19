import { useCallback, useEffect, useState } from 'react';
import { Search, Briefcase, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' },
  { value: 'draft', label: 'Draft' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_BADGE = {
  draft: 'neutral',
  open: 'success',
  in_progress: 'info',
  closed: 'danger',
  featured: 'warning',
  active: 'success',
};

export default function AdminJobsPage() {
  usePageTitle('Manage Jobs — Admin');

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [moderateTarget, setModerateTarget] = useState(null);
  const [moderateAction, setModerateAction] = useState(null);
  const [processing, setProcessing] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const response = await adminService.getJobs(params);
      const payload = response.data ?? response;
      setJobs(Array.isArray(payload) ? payload : (payload.data ?? []));
      setMeta(response.meta ?? payload.meta ?? { current_page: 1, last_page: 1, total: 0 });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load jobs.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadJobs();
  };

  const handleModerate = async () => {
    if (!moderateTarget || !moderateAction) return;
    setProcessing(true);
    try {
      if (moderateAction === 'delete') {
        await adminService.deleteJob(moderateTarget.id);
      } else {
        await adminService.moderateJob(moderateTarget.id, moderateAction);
      }
      setModerateTarget(null);
      setModerateAction(null);
      loadJobs();
    } catch {
      // non-critical
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Job Moderation</h1>
        <p className="text-sm text-gray-500">
          Review and moderate jobs posted on the platform. {meta.total} total jobs.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                icon={Search}
                placeholder="Search by title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <Button type="submit" variant="outline" size="md">
              <Filter className="h-4 w-4" /> Search
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Jobs list */}
      {error ? (
        <ErrorState title="Unable to load jobs" description={error} onRetry={loadJobs} />
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-card border border-gray-200 bg-white" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description="No jobs match your current filters."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-card border border-gray-200 bg-white shadow-card">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                    Job
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                    Employer
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                    Budget
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="hidden px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 lg:table-cell">
                    Posted
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <p className="text-sm font-bold text-ink-900">{job.title}</p>
                      <p className="text-xs text-gray-500">ID: {job.id}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {job.employer?.name ?? job.user?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-ink-900">
                      {formatETB(job.budget ?? job.max_budget ?? job.min_budget)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={STATUS_BADGE[job.status] || 'neutral'} size="xs">
                        {job.status?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="hidden px-5 py-3 text-xs text-gray-500 lg:table-cell">
                      {formatDate(job.created_at ?? job.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {job.status === 'open' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => { setModerateTarget(job); setModerateAction('closed'); }}
                          >
                            Close
                          </Button>
                        )}
                        {job.status === 'closed' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => { setModerateTarget(job); setModerateAction('open'); }}
                          >
                            Reopen
                          </Button>
                        )}
                        {job.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => { setModerateTarget(job); setModerateAction('open'); }}
                          >
                            Approve
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={() => { setModerateTarget(job); setModerateAction('delete'); }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {meta.current_page} of {meta.last_page}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm modal */}
      <Modal
        open={Boolean(moderateTarget && moderateAction)}
        onClose={() => { setModerateTarget(null); setModerateAction(null); }}
        title={
          moderateAction === 'delete'
            ? 'Delete Job'
            : moderateAction === 'featured'
              ? 'Feature Job'
              : 'Unfeature Job'
        }
        description={
          moderateAction === 'delete'
            ? `Permanently delete "${moderateTarget?.title}"? This action cannot be undone.`
            : moderateAction === 'featured'
              ? `Feature "${moderateTarget?.title}" on the platform?`
              : `Remove "${moderateTarget?.title}" from featured?`
        }
        size="sm"
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => { setModerateTarget(null); setModerateAction(null); }}>
            Cancel
          </Button>
          <Button
            variant={moderateAction === 'delete' ? 'danger' : 'primary'}
            size="sm"
            loading={processing}
            onClick={handleModerate}
          >
            {moderateAction === 'delete'
              ? 'Delete'
              : moderateAction === 'featured'
                ? 'Feature'
                : 'Unfeature'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
