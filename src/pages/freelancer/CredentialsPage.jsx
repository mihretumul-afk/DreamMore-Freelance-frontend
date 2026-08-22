import { useCallback, useEffect, useState } from 'react';
import {
  Award,
  FileText,
  Plus,
  Trash2,
  Pencil,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  Eye,
  Download,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/marketplace/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import DocumentPreview from '../../components/ui/DocumentPreview';
import { credentialService } from '../../services/credentialService';
import { getErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';

const CREDENTIAL_TYPES = [
  { value: 'dream_more_certificate', label: 'Dream More Certificate' },
  { value: 'external_certificate', label: 'External Company Certificate' },
  { value: 'training_certificate', label: 'Training Certificate' },
  { value: 'professional_qualification', label: 'Professional Qualification' },
  { value: 'other', label: 'Other Credential' },
];

const STATUS_CONFIG = {
  pending: { icon: Clock, tone: 'warning', label: 'Pending Review' },
  approved: { icon: CheckCircle, tone: 'success', label: 'Approved' },
  rejected: { icon: XCircle, tone: 'danger', label: 'Rejected' },
};

/** Get MIME type from file name */
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

const INITIAL_FORM = {
  title: '',
  type: 'external_certificate',
  issuing_organization: '',
  certificate_identifier: '',
  description: '',
  issue_date: '',
  expiry_date: '',
  document: null,
};

export default function CredentialsPage() {
  usePageTitle('My Credentials');
  const { showToast } = useToast();

  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Document preview state
  const [previewTarget, setPreviewTarget] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadCredentials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await credentialService.getMyCredentials();
      if (response.success) {
        setCredentials(response.data ?? []);
      } else {
        setError(response.message || 'Unable to load credentials.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load credentials. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setFormErrors({});
    setEditingId(null);
  };

  const openUpload = () => {
    resetForm();
    setShowUploadModal(true);
  };

  const openEdit = (cred) => {
    setEditingId(cred.id);
    setForm({
      title: cred.title ?? '',
      type: cred.type ?? 'external_certificate',
      issuing_organization: cred.issuing_organization ?? '',
      certificate_identifier: cred.certificate_identifier ?? '',
      description: cred.description ?? '',
      issue_date: cred.issue_date ?? '',
      expiry_date: cred.expiry_date ?? '',
      document: null,
    });
    setFormErrors({});
    setShowUploadModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('type', form.type);
      if (form.issuing_organization) formData.append('issuing_organization', form.issuing_organization);
      if (form.certificate_identifier) formData.append('certificate_identifier', form.certificate_identifier);
      if (form.description) formData.append('description', form.description);
      if (form.issue_date) formData.append('issue_date', form.issue_date);
      if (form.expiry_date) formData.append('expiry_date', form.expiry_date);
      if (form.document) formData.append('document', form.document);

      if (editingId) {
        if (!form.document) {
          formData.delete('document');
        }
        await credentialService.updateCredential(editingId, formData);
        showToast('Credential updated successfully!', 'success');
      } else {
        await credentialService.createCredential(formData);
        showToast('Credential submitted for verification.', 'success');
      }
      setShowUploadModal(false);
      resetForm();
      loadCredentials();
    } catch (err) {
      if (err?.response?.status === 422) {
        setFormErrors(err.response.data?.errors ?? {});
        showToast(getErrorMessage(err, 'Unable to save credential. Please check your input.'), 'error');
      } else {
        showToast(getErrorMessage(err, 'Unable to save credential. Please try again.'), 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await credentialService.deleteCredential(deleteTarget.id);
      showToast('Credential deleted successfully.', 'success');
      setDeleteTarget(null);
      loadCredentials();
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to delete credential. Please try again.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  /** Fetch the credential file and create a blob URL for preview. */
  const handlePreview = useCallback(async (cred) => {
    setPreviewLoading(true);
    setPreviewTarget(cred);
    try {
      const response = await credentialService.downloadCredential(cred.id);
      const mime = getMimeType(cred.file_original_name) || response.headers?.['content-type'] || 'application/pdf';
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
  const handleDownload = useCallback(async (cred) => {
    try {
      const response = await credentialService.downloadCredential(cred.id);
      const mime = getMimeType(cred.file_original_name) || response.headers?.['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', cred.file_original_name || `credential-${cred.id}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch {
      showToast('Unable to download file. Please try again.', 'error');
    }
  }, [showToast]);

  const getTypeLabel = (type) => CREDENTIAL_TYPES.find((t) => t.value === type)?.label ?? type;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="My Credentials"
        description="Manage your certificates, qualifications, and professional documents."
      />

      {/* Stats */}
      {(() => {
        const dmCertified = credentials.filter((c) => c.auto_verified && c.verification_source === 'dream_more_lms' && c.status === 'approved').length;
        const externalVerified = credentials.filter((c) => c.verification_source === 'external_manual' && c.status === 'approved').length;
        const testRequired = credentials.filter((c) => c.test_required && c.test_status !== 'passed').length;
        return (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="p-4 text-center">
              <p className="text-2xl font-extrabold text-ink-900">{credentials.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-extrabold text-green-600">{dmCertified}</p>
              <p className="text-xs text-gray-500">Dream More Certified</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-extrabold text-blue-600">{externalVerified}</p>
              <p className="text-xs text-gray-500">External Verified</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-extrabold text-amber-500">{testRequired}</p>
              <p className="text-xs text-gray-500">Tests Required</p>
            </Card>
          </div>
        );
      })()}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {credentials.length} credential{credentials.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={openUpload}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add Credential
        </Button>
      </div>

      {/* Content */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-card border border-gray-200 bg-white" />
          ))}
        </div>
      )}

      {error && (
        <ErrorState title="Unable to load credentials" description={error} onRetry={loadCredentials} />
      )}

      {!loading && !error && credentials.length === 0 && (
        <EmptyState
          icon={Award}
          title="No credentials yet"
          description="Upload your certificates, qualifications, and professional documents to build trust with potential employers."
          action={
            <Button onClick={openUpload} size="sm">
              <Upload className="h-4 w-4" aria-hidden="true" /> Upload your first credential
            </Button>
          }
        />
      )}

      {!loading && !error && credentials.length > 0 && (
        <div className="space-y-3">
          {credentials.map((cred) => {
            const StatusInfo = STATUS_CONFIG[cred.status] ?? STATUS_CONFIG.pending;
            const canEdit = cred.status === 'pending';
            const canDelete = cred.status === 'pending';
            const hasDocument = Boolean(cred.file_path);

            return (
              <Card key={cred.id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {cred.auto_verified && cred.verification_source === 'dream_more_lms' ? (
                        <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                      ) : (
                        <Award className="h-4 w-4 shrink-0 text-gray-400" />
                      )}
                      <h3 className="text-sm font-bold text-ink-900">{cred.title}</h3>
                      <Badge tone={StatusInfo.tone} size="xs">
                        {StatusInfo.label}
                      </Badge>
                      <Badge tone="neutral" size="xs">
                        {getTypeLabel(cred.type)}
                      </Badge>
                      {cred.auto_verified && cred.verification_source === 'dream_more_lms' && (
                        <Badge tone="success" size="xs">
                          Dream More Certified
                        </Badge>
                      )}
                      {cred.test_required && cred.test_status !== 'passed' && (
                        <Badge tone="warning" size="xs">
                          Test Required
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {cred.issuing_organization && (
                        <p className="text-xs text-gray-500">
                          Issued by {cred.issuing_organization}
                          {cred.certificate_identifier && ` (ID: ${cred.certificate_identifier})`}
                        </p>
                      )}
                      {cred.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">{cred.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        {cred.issue_date && <span>Issued {formatDate(cred.issue_date)}</span>}
                        {cred.expiry_date && <span>· Expires {formatDate(cred.expiry_date)}</span>}
                      </div>
                    </div>
                    {cred.status === 'rejected' && cred.rejection_reason && (
                      <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                        <strong>Rejection reason:</strong> {cred.rejection_reason}
                      </div>
                    )}
                    {cred.test_required && cred.test_status !== 'passed' && cred.status !== 'rejected' && (
                      <div className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
                        <strong>Skill assessment required.</strong> You must pass the skill test before this credential can be verified.
                      </div>
                    )}
                    {cred.lms_course_name && (
                      <p className="mt-1 text-xs text-gray-400">
                        Course: {cred.lms_course_name}
                        {cred.lms_certificate_id && ` · Certificate ID: ${cred.lms_certificate_id}`}
                      </p>
                    )}
                    {cred.file_original_name && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                        <FileText className="h-3 w-3" aria-hidden="true" /> {cred.file_original_name}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {hasDocument && (
                      <>
                        <Button variant="outline" size="xs" onClick={() => handlePreview(cred)}>
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Preview
                        </Button>
                        <Button variant="outline" size="xs" onClick={() => handleDownload(cred)}>
                          <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download
                        </Button>
                      </>
                    )}
                    {canEdit && (
                      <Button variant="outline" size="xs" onClick={() => openEdit(cred)}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="danger" size="xs" onClick={() => setDeleteTarget(cred)}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload/Edit Modal */}
      <Modal
        open={showUploadModal}
        onClose={() => { setShowUploadModal(false); resetForm(); }}
        title={editingId ? 'Edit Credential' : 'Upload Credential'}
        description={editingId ? 'Update your credential details.' : 'Submit a new certificate or professional document.'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. AWS Solutions Architect"
            error={formErrors.title?.[0]}
          />

          <Select
            label="Credential type"
            required
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            error={formErrors.type?.[0]}
          >
            {CREDENTIAL_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>

          <Input
            label="Issuing organization"
            value={form.issuing_organization}
            onChange={(e) => setForm({ ...form, issuing_organization: e.target.value })}
            placeholder="e.g. Amazon Web Services"
            error={formErrors.issuing_organization?.[0]}
          />

          <Input
            label="Certificate / Document ID"
            value={form.certificate_identifier}
            onChange={(e) => setForm({ ...form, certificate_identifier: e.target.value })}
            placeholder="e.g. AWS-SAP-2024-12345"
            error={formErrors.certificate_identifier?.[0]}
          />

          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description of this credential..."
            rows={3}
            error={formErrors.description?.[0]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Issue date"
              value={form.issue_date}
              onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
              error={formErrors.issue_date?.[0]}
            />
            <Input
              type="date"
              label="Expiry date"
              value={form.expiry_date}
              onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
              error={formErrors.expiry_date?.[0]}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-800">
              Document {editingId ? '(upload to replace)' : ''} <span className="text-danger-500">*</span>
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={(e) => setForm({ ...form, document: e.target.files?.[0] ?? null })}
              className="w-full rounded-input border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-brand-600 hover:file:bg-brand-100"
              aria-describedby="document-hint"
            />
            <p id="document-hint" className="mt-1 text-xs text-gray-500">
              JPG, PNG, WEBP, or PDF. Max 10 MB.
            </p>
            {formErrors.document?.[0] && (
              <p className="mt-1 text-xs font-medium text-danger-600">{formErrors.document[0]}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
            <Button type="button" variant="outline" onClick={() => { setShowUploadModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingId ? 'Update Credential' : 'Submit Credential'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Credential"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
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
