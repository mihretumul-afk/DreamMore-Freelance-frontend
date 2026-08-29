import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Handshake, Clock, CheckCircle2, AlertTriangle, Search, Filter } from 'lucide-react';
import Card, { CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { contractService } from '../../services/contractService';
import { formatDate, formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';

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

function ContractCard({ contract }) {
  const status = STATUS_MAP[contract.status] ?? { tone: 'neutral', label: contract.status };
  const Icon = status.icon ?? Handshake;

  return (
    <Link
      to={`/freelancer/contracts/${contract.id}`}
      className="group block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-ink-900 group-hover:text-brand-600 truncate">
            {contract.title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 truncate">
            {contract.job?.title ?? 'Job'}
          </p>
        </div>
        <Badge tone={status.tone} size="sm">
          <Icon className="mr-1 h-3 w-3" />
          {status.label}
        </Badge>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-ink-900">{formatETB(contract.total_amount)}</span>
        </div>
        {contract.employer && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Employer:</span>
            <span className="font-medium text-ink-800">{contract.employer.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">Created:</span>
          <span>{formatDate(contract.created_at)}</span>
        </div>
        {contract.milestones && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Milestones:</span>
            <span className="font-medium text-ink-800">{contract.milestones.length}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function FreelancerContractsPage() {
  usePageTitle('My Contracts — Freelancer');

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">My Contracts</h1>
        <p className="mt-0.5 text-sm text-gray-500">View and manage your active and past contracts.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Content */}
      {error ? (
        <ErrorState title="Failed to load contracts" description={error} onRetry={load} />
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white" />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No contracts yet"
          description={statusFilter ? 'No contracts match this filter.' : 'You don\'t have any contracts yet. Start by submitting proposals to jobs.'}
        />
      ) : (
        <div className="space-y-4">
          {contracts.map((c) => (
            <ContractCard key={c.id} contract={c} />
          ))}
        </div>
      )}
    </div>
  );
}
