import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle, XCircle, FileText, Award, Download, Eye } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import DocumentPreview from '../../components/ui/DocumentPreview';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'identity', label: 'Identity Verifications' },
  { value: 'credential', label: 'Credentials' },
];

const STATUS_BADGE = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

/** Get the MIME type from a file name extension. */
function getMimeType(fileName) {
  if (!fileName) return null;
  const ext = fileName.split('.').pop().toLowerCase();
  const map = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  return map[ext] || null;
}

export default function AdminVerificationsPage() {
  usePageTitle('Verifications — Admin');
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Document preview state
  const [previewTarget, setPreviewTarget] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadVerifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;

      const response = await adminService.getVerifications(params);
      const payload = response.data ?? response;
      setItems(Array.isArray(payload) ? payload : (payload.data ?? []));
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load verifications.'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    loadVerifications();
  }, [loadVerifications]);

  const handleAction = async () => {
    if (!actionTarget || !actionType) return;
    setProcessing(true);
    try {
      const isCredential = actionTarget.item_type === 'credential';

      if (isCredential) {
        if (actionType === 'approve') {
          await adminService.approveCredential(actionTarget.id);
          showToast('Credential approved successfully.', 'success');
        } else {
          await adminService.rejectCredential(actionTarget.id, rejectReason);
          showToast('Credential rejected.', 'success');
        }
      } else {
        if (actionType === 'approve') {
          await adminService.approveVerification(actionTarget.id);
          showToast('Verification approved.', 'success');
        } else {
          await adminService.rejectVerification(actionTarget.id, rejectReason);
          showToast('Verification rejected.', 'success');
        }
      }
      setActionTarget(null);
      setActionType(null);
      setRejectReason('');
      loadVerifications();
    } catch (err) {
      showToast(getErrorMessage(err, 'Action failed. Please try again.'), 'error');
    } finally {
      setProcessing(false);
    }
  };

  /** Fetch the credential file and create a blob URL for preview. */
  const handlePreview = useCallback(async (credential) => {
    setPreviewLoading(true);
    setPreviewTarget(credential);
    try {
      const response = await adminService.downloadCredential(credential.id);
      const mime = getMimeType(credential.file_original_name) || response.headers?.['content-type'] || 'application/pdf';
      const blob = new Blob([response.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(null);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  /** Download a credential file. */
  const handleDownload = useCallback(async (credential) => {
    try {
      const response = await adminService.downloadCredential(credential.id);
      const mime = getMimeType(credential.file_original_name) || response.headers?.['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', credential.file_original_name || `credential-${credential.id}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch {
      showToast('Unable to download credential file. Please try again.', 'error');
    }
  }, [showToast]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Verifications</h1>
        <p className="text-sm text-gray-500">Review identity verifications and credential submissions.</p>
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
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {TYPE_OPTIONS.map((opt) => (
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
          {items.map((v) => {
            const isCredential = v.item_type === 'credential';
            const TypeIcon = isCredential ? Award : FileText;
            const hasDocument = isCredential && v.file_path;

            return (
              <Card key={`${v.item_type}-${v.id}`}>
                <CardBody>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 shrink-0 text-gray-400" />
                        <p className="text-sm font-bold text-ink-900">
                          {v.user?.name ?? `User #${v.user_id}`}
                        </p>
                        <Badge tone={STATUS_BADGE[v.status] || 'neutral'} size="xs">
                          {v.status}
                        </Badge>
                        <Badge tone="neutral" size="xs">
                          {isCredential ? v.type?.replace(/_/g, ' ') : v.type || 'Identity'}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {isCredential ? (
                          <>
                            {v.title}
                            {v.issuing_organization && ` — ${v.issuing_organization}`}
                            {v.certificate_identifier && ` (ID: ${v.certificate_identifier})`}
                            {v.issue_date && ` · Issued ${formatDate(v.issue_date)}`}
                          </>
                        ) : (
                          <>
                            {v.type || 'Identity verification'} · Submitted {formatDate(v.created_at ?? v.createdAt)}
                          </>
                        )}
                      </p>
                      {isCredential && v.verification_source && (
                        <p className="mt-0.5 text-xs">
                          {v.verification_source === 'dream_more_lms' ? (
                            <span className="font-medium text-green-600">
                              ✓ Dream More LMS — {v.auto_verified ? 'Auto-verified' : 'Source verified'}
                              {v.lms_course_name && ` · Course: ${v.lms_course_name}`}
                            </span>
                          ) : (
                            <span className="font-medium text-blue-600">
                              External credential — requires admin review
                            </span>
                          )}
                        </p>
                      )}
                      {isCredential && v.test_required && (
                        <p className="mt-0.5 text-xs text-amber-600 font-medium">
                          Skill test: {v.test_status === 'passed' ? '✓ Passed' : v.test_status === 'failed' ? '✗ Failed' : 'Pending'}
                        </p>
                      )}
                      {isCredential && v.file_path && (
                        <p className="mt-1 text-xs text-gray-400">Document: {v.file_original_name || 'Attached file'}</p>
                      )}
                      {!isCredential && v.document_url && (
                        <a
                          href={v.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs font-semibold text-brand-600 hover:text-brand-700"
                        >
                          View document
                        </a>
                      )}
                      {v.status === 'rejected' && v.rejection_reason && (
                        <p className="mt-1 text-xs text-danger-600">Reason: {v.rejection_reason}</p>
                      )}
                      {v.status === 'rejected' && v.reason && (
                        <p className="mt-1 text-xs text-danger-600">Reason: {v.reason}</p>
                      )}
                      {v.reviewed_at && (
                        <p className="mt-1 text-xs text-gray-400">
                          Reviewed {formatDate(v.reviewed_at)}
                          {v.reviewer && ` by ${v.reviewer.name}`}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2 flex-wrap">
                      {/* Document actions for credentials */}
                      {hasDocument && (
                        <>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handlePreview(v)}
                          >
                            <Eye className="h-3.5 w-3.5" /> Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleDownload(v)}
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </Button>
                        </>
                      )}
                      {v.status === 'pending' && (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action modal */}
      <Modal
        open={Boolean(actionTarget && actionType)}
        onClose={() => { setActionTarget(null); setActionType(null); setRejectReason(''); }}
        title={actionType === 'approve' ? 'Approve' : 'Reject'}
        description={
          actionType === 'approve'
            ? `Approve the ${actionTarget?.item_type === 'credential' ? 'credential' : 'verification'} request for ${actionTarget?.user?.name ?? 'this user'}?`
            : `Reject the ${actionTarget?.item_type === 'credential' ? 'credential' : 'verification'} request for ${actionTarget?.user?.name ?? 'this user'}.`
        }
        size="sm"
      >
        {actionType === 'reject' && (
          <div className="mb-4">
            <Textarea
              label="Rejection reason (optional)"
              placeholder="Why is this being rejected?"
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

      {/* Document Preview Modal */}
      <DocumentPreview
        open={Boolean(previewTarget)}
        onClose={() => {
          if (previewUrl?.startsWith('blob:')) window.URL.revokeObjectURL(previewUrl);
          setPreviewTarget(null);
          setPreviewUrl(null);
        }}
        fileName={previewTarget?.file_original_name}
        fileType={getMimeType(previewTarget?.file_original_name)}
        downloadUrl={previewUrl}
        loading={previewLoading}
        onDownload={previewTarget ? () => handleDownload(previewTarget) : undefined}
      />
    </div>
  );
}
