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

const CREDENTIAL_TYPES = [
  { value: 'dream_more_certificate', label: 'Dream More Certificate' },
  { value: 'external_certificate', label: 'External Certificate' },
  { value: 'training_certificate', label: 'Training Certificate' },
  { value: 'professional_qualification', label: 'Professional Qualification' },
  { value: 'other', label: 'Other' },
];

const STATUS_CONFIG = {
  pending: { tone: 'warning', label: 'Pending Review', icon: Clock },
  approved: { tone: 'success', label: 'Approved', icon: CheckCircle },
  rejected: { tone: 'danger', label: 'Rejected', icon: XCircle },
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
    type: 'external_certificate',
    issuingOrganization: '',
    certificateIdentifier: '',
    issueDate: '',
    expiryDate: '',
    document: null,
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
    if (!form.title.trim()) {
      setFieldErrors({ title: 'Title is required.' });
      return;
    }
    if (!form.document) {
      setFieldErrors({ document: 'Please select a document to upload.' });
      return;
    }

    setFieldErrors({});
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('type', form.type);
      formData.append('document', form.document);
      if (form.issuingOrganization.trim()) formData.append('issuing_organization', form.issuingOrganization.trim());
      if (form.certificateIdentifier.trim()) formData.append('certificate_identifier', form.certificateIdentifier.trim());
      if (form.issueDate) formData.append('issue_date', form.issueDate);
      if (form.expiryDate) formData.append('expiry_date', form.expiryDate);

      await credentialService.createCredential(formData);
      setShowUpload(false);
      setForm({
        title: '',
        type: 'external_certificate',
        issuingOrganization: '',
        certificateIdentifier: '',
        issueDate: '',
        expiryDate: '',
        document: null,
      });
      loadCredentials();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const mapped = {};
        if (errors.title) mapped.title = Array.isArray(errors.title) ? errors.title[0] : errors.title;
        if (errors.document) mapped.document = Array.isArray(errors.document) ? errors.document[0] : errors.document;
        setFieldErrors(mapped);
      } else {
        setFieldErrors({ document: getErrorMessage(err, 'Upload failed.') });
      }
    } finally {
      setUploading(false);
    }
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
                      {cred.status === 'rejected' && cred.rejection_reason && (
                        <p className="mt-1 text-xs text-danger-600">
                          Rejection reason: {cred.rejection_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="ghost" size="xs" onClick={() => handleDownload(cred)}>
                        <Download className="h-3.5 w-3.5" /> Download
                      </Button>
                      {cred.status === 'pending' && (
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
        onClose={() => setShowUpload(false)}
        title="Add Credential"
        description="Upload a professional document or certificate for review."
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Title *"
            placeholder="e.g. Web Development Certificate"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            error={fieldErrors.title}
            disabled={uploading}
          />

          <Select
            label="Type *"
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
            disabled={uploading}
          >
            {CREDENTIAL_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>

          <Input
            label="Issuing Organization"
            placeholder="e.g. Dream More, Coursera, etc."
            value={form.issuingOrganization}
            onChange={(e) => setForm((prev) => ({ ...prev, issuingOrganization: e.target.value }))}
            disabled={uploading}
          />

          <Input
            label="Certificate / Document ID"
            placeholder="e.g. DM-WD-2024-001"
            value={form.certificateIdentifier}
            onChange={(e) => setForm((prev) => ({ ...prev, certificateIdentifier: e.target.value }))}
            disabled={uploading}
          />

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

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">Document *</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
            />
            {form.document && (
              <p className="mt-1 text-xs text-gray-500">Selected: {form.document.name}</p>
            )}
            {fieldErrors.document && (
              <p role="alert" className="mt-1 text-xs font-medium text-danger-600">
                {fieldErrors.document}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-400">JPG, PNG, WEBP, or PDF. Max 10MB.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
            <Button variant="outline" onClick={() => setShowUpload(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} loading={uploading}>
              Submit for Review
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
