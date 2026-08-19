import { useCallback, useEffect, useState } from 'react';
import { Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

const STATUS_BADGE = {
  pending: 'warning',
  resolved: 'success',
  dismissed: 'neutral',
};

export default function AdminReportsPage() {
  usePageTitle('Reports — Admin');

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);

  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolution, setResolution] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      const response = await adminService.getReports(params);
      const payload = response.data ?? response;
      setReports(Array.isArray(payload) ? payload : (payload.data ?? []));
      setMeta(response.meta ?? payload.meta ?? { current_page: 1, last_page: 1, total: 0 });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load reports.'));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleResolve = async () => {
    if (!resolveTarget) return;
    setProcessing(true);
    try {
      await adminService.resolveReport(resolveTarget.id, resolution);
      setResolveTarget(null);
      setResolution('');
      loadReports();
    } catch {
      // non-critical
    } finally {
      setProcessing(false);
    }
  };

  const handleDismiss = async (report) => {
    try {
      await adminService.dismissReport(report.id);
      loadReports();
    } catch {
      // non-critical
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Reports</h1>
        <p className="text-sm text-gray-500">
          Review and resolve platform reports. {meta.total} total reports.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Reports list */}
      {error ? (
        <ErrorState title="Unable to load reports" description={error} onRetry={loadReports} />
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-card border border-gray-200 bg-white" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No reports"
          description={statusFilter ? `No ${statusFilter} reports found.` : 'No reports found.'}
        />
      ) : (
        <>
          <div className="space-y-3">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardBody>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-ink-900">
                          {report.reason || report.type || 'Report'}
                        </p>
                        <Badge tone={STATUS_BADGE[report.status] || 'neutral'} size="xs">
                          {report.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {report.description || report.message || 'No description provided.'}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Reported by {report.reporter?.name ?? 'Unknown'} · {formatDate(report.created_at ?? report.createdAt)}
                        {report.target && ` · Target: ${report.target_type ?? 'Unknown'} #${report.target.id ?? report.target_id}`}
                      </p>
                    </div>
                    {report.status === 'pending' && (
                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant="success"
                          size="xs"
                          onClick={() => setResolveTarget(report)}
                        >
                          Resolve
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleDismiss(report)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
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

      {/* Resolve modal */}
      <Modal
        open={Boolean(resolveTarget)}
        onClose={() => { setResolveTarget(null); setResolution(''); }}
        title="Resolve Report"
        description={`Provide a resolution note for this report.`}
        size="sm"
      >
        <div className="mb-4">
          <Textarea
            label="Resolution notes (optional)"
            placeholder="Describe the action taken or resolution applied."
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => { setResolveTarget(null); setResolution(''); }}>
            Cancel
          </Button>
          <Button
            variant="success"
            size="sm"
            loading={processing}
            onClick={handleResolve}
          >
            Mark Resolved
          </Button>
        </div>
      </Modal>
    </div>
  );
}
