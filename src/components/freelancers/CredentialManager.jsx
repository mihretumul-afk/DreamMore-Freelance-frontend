import { useCallback, useEffect, useState } from 'react';
import {
  Award,
  FileText,
  Plus,
  Trash2,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  Key,
  Building2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import Card, { CardHeader, CardBody } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { credentialService } from '../../services/credentialService';
import { getErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

const CREDENTIAL_TYPES = [
  { value: 'dream_more_certificate', label: 'DreamMore Certificate', icon: Sparkles, description: 'Verify your DreamMore learning achievements' },
  { value: 'external_certificate', label: 'External Company Certificate', icon: Building2, description: 'Upload certificates from external organizations' },
];

const STATUS_CONFIG = {
  pending: { tone: 'warning', label: 'Pending Review', icon: Clock },
  approved: { tone: 'success', label: 'Approved', icon: CheckCircle },
  rejected: { tone: 'danger', label: 'Rejected', icon: XCircle },
  resubmission_required: { tone: 'purple', label: 'Resubmission Required', icon: RefreshCw },
};

const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf',
];

/**
 * CredentialManager — upload, view, and manage freelancer credentials.
 */
export default function CredentialManager() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'dream_more_certificate',
    issuingOrganization: '',
    certificateIdentifier: '',
    issueDate: '',
    expiryDate: '',
    document: null,
    description: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadCredentials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await credentialService.getMyCredentials();
      const data = response.data ?? response;
      setCredentials(Array.isArray(data) ? data : data.data ?? []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load credentials.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFieldErrors((prev) => ({ ...prev, document: 'Please upload a JPG, PNG, WEBP, or PDF file.' }));
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, document: 'File size must be less than 10MB.' }));
      e.target.value = '';
      return;
    }

    setForm((prev) => ({ ...prev, document: file }));
    setFieldErrors((prev) => ({ ...prev, document: undefined }));
  };

  const handleUpload = async () => {
    // Validation
    if (!form.title.trim()) {
      setFieldErrors({ title: 'Title is required.' });
      return;
    }

    if (form.type === 'dream_more_certificate') {
      // DreamMore certificate requires certificate ID
      if (!form.certificateIdentifier.trim()) {
        setFieldErrors({ certificateIdentifier: 'Certificate ID is required for DreamMore certificates.' });
        return;
      }
    } else {
      // External certificate requires document upload
      if (!form.document) {
        setFieldErrors({ document: 'Please upload your certificate document.' });
        return;
      }
    }

    setFieldErrors({});
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('type', form.type);
      formData.append('description', form.description.trim());
      
      if (form.type === 'dream_more_certificate') {
        // DreamMore certificate: submit certificate ID
        formData.append('certificate_identifier', form.certificateIdentifier.trim());
        formData.append('issuing_organization', 'DreamMore');
      } else {
        // External certificate: submit document
        if (form.document) formData.append('document', form.document);
        if (form.issuingOrganization.trim()) formData.append('issuing_organization', form.issuingOrganization.trim());
        if (form.certificateIdentifier.trim()) formData.append('certificate_identifier', form.certificateIdentifier.trim());
      }
      
      if (form.issueDate) formData.append('issue_date', form.issueDate);
      if (form.expiryDate) formData.append('expiry_date', form.expiryDate);

      await credentialService.createCredential(formData);
      setShowUpload(false);
      resetForm();
      loadCredentials();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const mapped = {};
        if (errors.title) mapped.title = Array.isArray(errors.title) ? errors.title[0] : errors.title;
        if (errors.document) mapped.document = Array.isArray(errors.document) ? errors.document[0] : errors.document;
        if (errors.certificate_identifier) mapped.certificateIdentifier = Array.isArray(errors.certificate_identifier) ? errors.certificate_identifier[0] : errors.certificate_identifier;
        setFieldErrors(mapped);
      } else {
        setFieldErrors({ general: getErrorMessage(err, 'Upload failed.') });
      }
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      type: 'dream_more_certificate',
      issuingOrganization: '',
      certificateIdentifier: '',
      issueDate: '',
      expiryDate: '',
      document: null,
      description: '',
    });
    setFieldErrors({});
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await credentialService.deleteCredential(deleteTarget.id);
      setDeleteTarget(null);
      loadCredentials();
    } catch {
      // non-critical
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (credential) => {
    try {
      const response = await credentialService.downloadCredential(credential.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', credential.file_original_name || `credential-${credential.id}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // non-critical
    }
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Credentials & Certificates"
          description="Upload professional documents, certificates, and qualifications."
          action={
            <Button size="sm" onClick={() => setShowUpload(true)}>
              <Plus className="h-4 w-4" /> Add Credential
            </Button>
          }
        />
        <CardBody>
          {error ? (
            <p className="text-sm text-danger-600">{error}</p>
          ) : credentials.length === 0 ? (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                <Award className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                No credentials uploaded yet. Add your professional certificates and qualifications.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {credentials.map((cred) => {
                const statusCfg = STATUS_CONFIG[cred.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusCfg.icon;

                return (
                  <li
                    key={cred.id}
                    className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                        <p className="text-sm font-bold text-ink-900">{cred.title}</p>
                        <Badge tone={statusCfg.tone} size="xs">
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-500">
                        <span>{CREDENTIAL_TYPES.find((t) => t.value === cred.type)?.label || cred.type}</span>
                        {cred.issuing_organization && <span>Issuer: {cred.issuing_organization}</span>}
                        {cred.certificate_identifier && <span>ID: {cred.certificate_identifier}</span>}
                        {cred.issue_date && <span>Issued: {formatDate(cred.issue_date)}</span>}
                        {cred.expiry_date && <span>Expires: {formatDate(cred.expiry_date)}</span>}
                      </div>
                      {(cred.status === 'rejected' || cred.status === 'resubmission_required') && cred.rejection_reason && (
                        <p className="mt-1 text-xs text-danger-600 font-medium">
                          {cred.status === 'resubmission_required' ? 'Resubmission reason' : 'Rejection reason'}: {cred.rejection_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {cred.file_path && (
                        <Button variant="ghost" size="xs" onClick={() => handleDownload(cred)}>
                          <Download className="h-3.5 w-3.5" /> Download
                        </Button>
                      )}
                      {(cred.status === 'pending' || cred.status === 'rejected' || cred.status === 'resubmission_required') && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setDeleteTarget(cred)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-danger-500" /> Remove
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Upload Modal */}
      <Modal
        open={showUpload}
        onClose={() => { setShowUpload(false); resetForm(); }}
        title="Add Credential"
        description="Add a DreamMore certificate or upload an external company certificate."
        size="md"
      >
        <div className="space-y-5">
          {/* Certificate Type Selection */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-ink-900">Certificate Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {CREDENTIAL_TYPES.map((opt) => {
                const Icon = opt.icon;
                const isSelected = form.type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, type: opt.value, document: null, certificateIdentifier: '' }))}
                    disabled={uploading}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200',
                      isSelected
                        ? 'border-brand-500 bg-brand-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        isSelected ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className={cn('text-sm font-semibold', isSelected ? 'text-brand-700' : 'text-ink-900')}>
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-gray-500">{opt.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <Input
            label="Certificate Title *"
            placeholder="e.g. Web Development Mastery"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            error={fieldErrors.title}
            disabled={uploading}
          />

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">Description</label>
            <textarea
              rows={3}
              placeholder="Brief description of this certificate..."
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              disabled={uploading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-ink-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {/* DreamMore Certificate: Certificate ID */}
          {form.type === 'dream_more_certificate' && (
            <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
                  <Key className="h-5 w-5 text-brand-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-brand-900">DreamMore Certificate Verification</p>
                  <p className="mt-0.5 text-xs text-brand-700">
                    Enter your certificate ID from DreamMore LMS. We'll verify it automatically.
                  </p>
                  <Input
                    label="Certificate ID *"
                    placeholder="e.g. DM-WD-2024-001"
                    value={form.certificateIdentifier}
                    onChange={(e) => setForm((prev) => ({ ...prev, certificateIdentifier: e.target.value }))}
                    error={fieldErrors.certificateIdentifier}
                    disabled={uploading}
                    className="mt-3"
                  />
                </div>
              </div>
            </div>
          )}

          {/* External Certificate: Document Upload */}
          {form.type === 'external_certificate' && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <Upload className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-ink-900">Upload Certificate Document</p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    Upload your certificate as a document, photo, or image file.
                  </p>
                  
                  <Input
                    label="Issuing Organization"
                    placeholder="e.g. Coursera, Google, AWS, etc."
                    value={form.issuingOrganization}
                    onChange={(e) => setForm((prev) => ({ ...prev, issuingOrganization: e.target.value }))}
                    disabled={uploading}
                    className="mt-3"
                  />

                  <div className="mt-3">
                    <label className="mb-1 block text-sm font-medium text-ink-900">Certificate Document *</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                      />
                    </div>
                    {form.document && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-white px-3 py-2 border border-gray-200">
                        <FileText className="h-4 w-4 text-brand-500" />
                        <span className="text-xs font-medium text-ink-900">{form.document.name}</span>
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, document: null }))}
                          className="ml-auto text-gray-400 hover:text-red-500"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {fieldErrors.document && (
                      <p role="alert" className="mt-1 text-xs font-medium text-danger-600">
                        {fieldErrors.document}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">JPG, PNG, WEBP, or PDF. Max 10MB.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Issue Date"
              value={form.issueDate}
              onChange={(e) => setForm((prev) => ({ ...prev, issueDate: e.target.value }))}
              disabled={uploading}
            />
            <Input
              type="date"
              label="Expiry Date"
              value={form.expiryDate}
              onChange={(e) => setForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
              disabled={uploading}
            />
          </div>

          {/* General error */}
          {fieldErrors.general && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">{fieldErrors.general}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => { setShowUpload(false); resetForm(); }} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} loading={uploading}>
              {form.type === 'dream_more_certificate' ? 'Verify Certificate' : 'Submit for Review'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Remove Credential"
        description={`Are you sure you want to remove "${deleteTarget?.title}"? This action cannot be undone.`}
        size="sm"
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}
