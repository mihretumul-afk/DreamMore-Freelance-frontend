import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
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
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_BADGE = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

export default function AdminVerificationsPage() {
  usePageTitle('Verifications — Admin');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadVerifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const response = await adminService.getVerifications(params);
      const payload = response.data ?? response;
      setItems(Array.isArray(payload) ? payload : (payload.data ?? []));
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load verifications.'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadVerifications();
  }, [loadVerifications]);

  const handleAction = async () => {
    if (!actionTarget || !actionType) return;
    setProcessing(true);
    try {
      if (actionType === 'approve') {
        await adminService.approveVerification(actionTarget.id);
      } else {
        await adminService.rejectVerification(actionTarget.id, rejectReason);
      }
      setActionTarget(null);
      setActionType(null);
      setRejectReason('');
      loadVerifications();
    } catch {
      // non-critical
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Verifications</h1>
        <p className="text-sm text-gray-500">Review and manage user verification requests.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* List */}
      {error ? (
        <ErrorState title="Unable to load verifications" description={error} onRetry={loadVerifications} />
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-card border border-gray-200 bg-white" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No verification requests"
          description={statusFilter ? `No ${statusFilter} verifications found.` : 'No verification requests found.'}
        />
      ) : (
        <div className="space-y-3">
          {items.map((v) => (
            <Card key={v.id}>
              <CardBody>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-ink-900">
                        {v.user?.name ?? `User #${v.user_id}`}
                      </p>
                      <Badge tone={STATUS_BADGE[v.status] || 'neutral'} size="xs">
                        {v.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {v.type || v.document_type || 'Identity verification'} · Submitted {formatDate(v.created_at ?? v.createdAt)}
                    </p>
                    {v.document_url && (
                      <a
                        href={v.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        View document
                      </a>
                    )}
                  </div>
                  {v.status === 'pending' && (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="success"
                        size="xs"
                        onClick={() => { setActionTarget(v); setActionType('approve'); }}
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => { setActionTarget(v); setActionType('reject'); }}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Action modal */}
      <Modal
        open={Boolean(actionTarget && actionType)}
        onClose={() => { setActionTarget(null); setActionType(null); setRejectReason(''); }}
        title={actionType === 'approve' ? 'Approve Verification' : 'Reject Verification'}
        description={
          actionType === 'approve'
            ? `Approve the verification request for ${actionTarget?.user?.name ?? 'this user'}?`
            : `Reject the verification request for ${actionTarget?.user?.name ?? 'this user'}.`
        }
        size="sm"
      >
        {actionType === 'reject' && (
          <div className="mb-4">
            <Textarea
              label="Rejection reason (optional)"
              placeholder="Why is this verification being rejected?"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => { setActionTarget(null); setActionType(null); }}>
            Cancel
          </Button>
          <Button
            variant={actionType === 'approve' ? 'success' : 'danger'}
            size="sm"
            loading={processing}
            onClick={handleAction}
          >
            {actionType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
