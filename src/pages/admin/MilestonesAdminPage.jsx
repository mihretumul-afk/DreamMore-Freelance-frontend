import { useCallback, useEffect, useState } from 'react';
import { Milestone, Search, RefreshCw, ChevronLeft, ChevronRight, Lock, CheckCircle2, Handshake, Filter, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card, { CardBody, CardHeader, CardFooter } from '../../components/ui/Card';
import StatusBadge from '../../components/marketplace/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { getAdminMilestones } from '../../services/paymentService';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatETB } from '../../utils/format';

export default function MilestonesAdminPage() {
  usePageTitle('Milestones — Admin');
  const { can } = useAdminPermissions();

  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const loadMilestones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await getAdminMilestones(params);
      const payload = res.data ?? res;
      setMilestones(Array.isArray(payload) ? payload : (payload.data ?? []));
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load milestones.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (can('milestones.view')) {
      loadMilestones();
    }
  }, [can, loadMilestones]);

  if (!can('milestones.view')) {
    return (
      <EmptyState
        icon={Milestone}
        title="Access Restricted"
        description="You do not have permission to view milestones."
      />
    );
  }

  const fundedCount = milestones.filter(m => m.status === 'funded' || m.status === 'in_progress').length;
  const releasedCount = milestones.filter(m => m.status === 'released' || m.status === 'approved' || m.status === 'paid').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Platform Milestones</h1>
          <p className="mt-0.5 text-sm text-gray-500">Monitor all contract checkpoints and escrow status.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadMilestones}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Metrics Header */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <Milestone className="h-4 w-4" /> Total Milestones Recorded
          </p>
          <p className="mt-1 text-2xl font-extrabold text-blue-900">{meta.total ?? milestones.length}</p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
          <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
            <Lock className="h-4 w-4" /> Active Escrow Funded
          </p>
          <p className="mt-1 text-2xl font-extrabold text-amber-900">{fundedCount} Active</p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
          <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Released & Completed
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-900">{releasedCount} Released</p>
        </div>
      </div>

      {/* Filter Card */}
      <Card>
        <CardBody className="py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search milestone or contract title..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-9 w-full rounded-input border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-9"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="funded">Funded</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="released">Released</option>
              <option value="disputed">Disputed</option>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Milestones Table */}
      <Card>
        {error ? (
          <CardBody>
            <ErrorState title="Failed to load milestones" description={error} onRetry={loadMilestones} />
          </CardBody>
        ) : loading ? (
          <div className="p-8 text-center text-sm text-gray-400 animate-pulse">Loading milestones...</div>
        ) : milestones.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={Milestone}
              title="No milestones found"
              description={search || statusFilter ? 'Try clearing your filters.' : 'Milestones created on contracts will appear here.'}
            />
          </CardBody>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-400">Milestone Title</th>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-400">Contract</th>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-400">Amount</th>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-400">Status</th>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-400">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {milestones.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-bold text-ink-900">{m.title}</p>
                        {m.description && <p className="text-xs text-gray-400 line-clamp-1">{m.description}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-brand-600">
                          {m.contract?.title || `Contract #${m.contract_id}`}
                        </p>
                      </td>
                      <td className="px-5 py-3 font-extrabold text-ink-900">
                        {formatETB(m.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={m.status} size="xs" />
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {formatDate(m.due_date || m.dueDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta.last_page > 1 && (
              <CardFooter>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Page {meta.current_page} of {meta.last_page}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(p => p + 1)}>
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardFooter>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
