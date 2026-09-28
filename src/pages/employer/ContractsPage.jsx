import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Handshake, Clock, CheckCircle2, AlertTriangle, Filter, Trash2 } from 'lucide-react';
import Card, { CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { contractService } from '../../services/contractService';
import { formatDate, formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';

const DELETABLE_STATUSES = ['pending_acceptance', 'active', 'completed', 'cancelled', 'disputed'];

const STATUS_MAP = {
  pending_acceptance: { tone: 'warning', icon: Clock, label: 'Pending Acceptance' },
  active:            { tone: 'success', icon: CheckCircle2, label: 'Active' },
  completed:         { tone: 'success', icon: CheckCircle2, label: 'Completed' },
  paused:            { tone: 'neutral', icon: Clock, label: 'Paused' },
  cancelled:         { tone: 'danger', icon: AlertTriangle, label: 'Cancelled' },
  disputed:          { tone: 'danger', icon: AlertTriangle, label: 'Disputed' },
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending_acceptance', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function ContractCard({ contract, onDelete, deletingId }) {
  const status = STATUS_MAP[contract.status] ?? { tone: 'neutral', label: contract.status };
  const Icon = status.icon ?? Handshake;
  const canDelete = DELETABLE_STATUSES.includes(contract.status);

  return (
    <div className="group block rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md">
      <Link
        to={`/employer/contracts/${contract.id}`}
        className="block cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-ink-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">
              {contract.title}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400 truncate">
              {contract.job?.title ?? 'Job'}
            </p>
          </div>
          <Badge tone={status.tone} size="sm">
            <Icon className="mr-1 h-3 w-3" />
            {status.label}
          </Badge>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-ink-900 dark:text-slate-100">{formatETB(contract.total_amount)}</span>
          </div>
          {contract.freelancer && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 dark:text-slate-400">Freelancer:</span>
              <span className="font-medium text-ink-800 dark:text-slate-200">{contract.freelancer.name}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 dark:text-slate-400">Created:</span>
            <span>{formatDate(contract.created_at)}</span>
          </div>
          {contract.milestones && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 dark:text-slate-400">Milestones:</span>
              <span className="font-medium text-ink-800 dark:text-slate-200">{contract.milestones.length}</span>
            </div>
          )}
        </div>
      </Link>

      {/* Delete button */}
      {canDelete && (
        <div className="mt-3 flex justify-end border-t border-gray-100 dark:border-slate-800 pt-3">
          <Button
            variant="ghost"
            size="xs"
            loading={deletingId === contract.id}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(contract);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 text-danger-500" aria-hidden="true" /> Delete
          </Button>
        </div>
      )}
    </div>
  );
}

export default function EmployerContractsPage() {
  usePageTitle('My Contracts — Employer');
  const { showToast } = useToast();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      const res = await contractService.getContracts(params);
      const data = res.data ?? res;
      setContracts(Array.isArray(data) ? data : (data.data ?? []));
      setMeta(res.meta ?? data.meta ?? { current_page: 1, last_page: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load contracts.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeletingId(deleteTarget.id);
    try {
      await contractService.deleteContract(deleteTarget.id);
      showToast('Contract deleted from your history.', 'success');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete contract.', 'error');
    } finally {
      setDeleting(false);
      setDeletingId(null);
    }
  }, [deleteTarget, load, showToast]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-slate-100">My Contracts</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">Manage your contracts with freelancers.</p>
      </div>

      <Card>
        <CardBody className="py-3">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-gray-400 dark:text-slate-400" />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {error ? (
        <ErrorState title="Failed to load contracts" description={error} onRetry={load} />
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No contracts yet"
          description={statusFilter ? 'No contracts match this filter.' : 'Accept a proposal to create a contract.'}
        />
      ) : (
        <div className="space-y-4">
          {contracts.map((c) => (
            <ContractCard
              key={c.id}
              contract={c}
              onDelete={setDeleteTarget}
              deletingId={deletingId}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Contract"
        description={`Are you sure you want to delete "${deleteTarget?.title}" from your history? This action cannot be undone.`}
        size="sm"
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
