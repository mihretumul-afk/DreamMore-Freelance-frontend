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
  Key,
  Building2,
  Sparkles,
  RefreshCw,
  Eye,
  Download,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  FileCheck,
  Check,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/marketplace/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import DocumentPreview from '../../components/ui/DocumentPreview';
import { credentialService } from '../../services/credentialService';
import { getErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../utils/cn';

const CREDENTIAL_TYPES = [
  {
    value: 'dream_more_certificate',
    label: 'DreamMore Certificate',
    tagline: 'Official certificate issued by DreamMore.',
    icon: Sparkles,
    badge: 'DreamMore Official',
    description: 'Verify certificates earned through DreamMore learning platform using your Certificate ID.',
  },
  {
    value: 'external_certificate',
    label: 'External Certificate',
    tagline: 'Certificate issued by another recognized organization.',
    icon: Building2,
    badge: 'External Issuer',
    description: 'Upload credentials, diplomas, or certificates from external institutions or providers.',
  },
];

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    tone: 'warning',
    label: 'Pending Verification',
    description: 'Your certificate is currently being reviewed by our verification team.',
  },
  approved: {
    icon: CheckCircle,
    tone: 'success',
    label: 'Approved',
    description: 'Verified qualification. This credential is visible on your profile.',
  },
  rejected: {
    icon: XCircle,
    tone: 'danger',
    label: 'Rejected',
    description: 'This submission did not meet verification criteria. Review feedback below.',
  },
  resubmission_required: {
    icon: RefreshCw,
    tone: 'purple',
    label: 'Resubmission Required',
    description: 'Action needed: Please update your submission according to admin feedback.',
  },
};

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

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
  type: 'dream_more_certificate',
  issuing_organization: '',
  certificate_identifier: '',
  description: '',
  issue_date: '',
  expiry_date: '',
  document: null,
};

export default function CredentialsPage() {
  usePageTitle('Certificates & Credentials');
  const { showToast } = useToast();

  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Wizard Modal State
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Drag and drop / File upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

  // Deletion state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Document preview modal state
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

  // Clean up object URLs on unmount or file reset
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setFormErrors({});
    setEditingId(null);
    setWizardStep(1);
    setUploadProgress(0);
    setIsUploadingFile(false);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
  };

  const openNewSubmission = () => {
    resetForm();
    setShowWizardModal(true);
  };

  const openEditResubmit = (cred) => {
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
    setWizardStep(cred.type === 'dream_more_certificate' ? 2 : 2);
    setShowWizardModal(true);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFile = (file) => {
    if (!file) return;

    // Validate type
    const isAllowedType = ALLOWED_MIME_TYPES.includes(file.type) ||
      ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(file.name.split('.').pop()?.toLowerCase());

    if (!isAllowedType) {
      setFormErrors((prev) => ({
        ...prev,
        document: 'Invalid file format. Please upload a PDF, JPG, or PNG file.',
      }));
      return;
    }

    // Validate max file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFormErrors((prev) => ({
        ...prev,
        document: `File exceeds maximum allowed size of 10 MB (selected file is ${formatBytes(file.size)}).`,
      }));
      return;
    }

    // Simulate quick upload progress visual
    setIsUploadingFile(true);
    setUploadProgress(20);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploadingFile(false);
          return 100;
        }
        return prev + 30;
      });
    }, 100);

    // Create local object URL for instant preview if image
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }

    setForm((prev) => ({ ...prev, document: file }));
    setFormErrors((prev) => ({ ...prev, document: undefined }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const removeSelectedFile = () => {
    setForm((prev) => ({ ...prev, document: null }));
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    setUploadProgress(0);
  };

  // Step Navigation Validation
  const validateStep2 = () => {
    const errors = {};
    if (form.type === 'dream_more_certificate') {
      if (!form.certificate_identifier.trim()) {
        errors.certificate_identifier = 'Certificate ID is required for DreamMore certificates.';
      }
      if (!form.title.trim()) {
        // Auto-fill title if blank for DreamMore certificate
        form.title = `DreamMore Certificate (${form.certificate_identifier.trim()})`;
      }
    } else {
      if (!form.title.trim()) {
        errors.title = 'Certificate title is required.';
      }
      if (!form.issuing_organization.trim()) {
        errors.issuing_organization = 'Issuing organization is required.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors = {};
    if (form.type === 'external_certificate' && !editingId && !form.document) {
      errors.document = 'Please upload a copy of your external certificate.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (wizardStep === 1) {
      setWizardStep(2);
    } else if (wizardStep === 2) {
      if (validateStep2()) {
        if (form.type === 'dream_more_certificate') {
          // DreamMore certificates skip document upload step and go straight to review
          setWizardStep(4);
        } else {
          setWizardStep(3);
        }
      }
    } else if (wizardStep === 3) {
      if (validateStep3()) {
        setWizardStep(4);
      }
    }
  };

  const handlePrevStep = () => {
    if (wizardStep === 4) {
      setWizardStep(form.type === 'dream_more_certificate' ? 2 : 3);
    } else if (wizardStep === 3) {
      setWizardStep(2);
    } else if (wizardStep === 2) {
      setWizardStep(1);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    setSubmitting(true);
    setFormErrors({});

    try {
      const formData = new FormData();
      formData.append('title', form.title || (form.type === 'dream_more_certificate' ? 'DreamMore Certificate' : 'External Certificate'));
      formData.append('type', form.type);
      formData.append('description', form.description || '');

      if (form.type === 'dream_more_certificate') {
        formData.append('certificate_identifier', form.certificate_identifier.trim());
        formData.append('issuing_organization', 'DreamMore');
      } else {
        if (form.document) formData.append('document', form.document);
        if (form.issuing_organization) formData.append('issuing_organization', form.issuing_organization.trim());
        if (form.certificate_identifier) formData.append('certificate_identifier', form.certificate_identifier.trim());
      }

      if (form.issue_date) formData.append('issue_date', form.issue_date);
      if (form.expiry_date) formData.append('expiry_date', form.expiry_date);

      if (editingId) {
        if (!form.document && form.type === 'external_certificate') {
          formData.delete('document');
        }
        await credentialService.updateCredential(editingId, formData);
        showToast('Certificate resubmitted for verification successfully!', 'success');
      } else {
        await credentialService.createCredential(formData);
        showToast('Certificate submitted for verification.', 'success');
      }

      setShowWizardModal(false);
      resetForm();
      loadCredentials();
    } catch (err) {
      if (err?.response?.status === 422) {
        setFormErrors(err.response.data?.errors ?? {});
        showToast(getErrorMessage(err, 'Submission validation failed. Please check inputs.'), 'error');
      } else {
        showToast(getErrorMessage(err, 'Submission failed. Please try again.'), 'error');
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
      showToast('Credential removed successfully.', 'success');
      setDeleteTarget(null);
      loadCredentials();
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to remove credential. Please try again.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

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

  const handleDownload = useCallback(async (cred) => {
    try {
      const response = await credentialService.downloadCredential(cred.id);
      const mime = getMimeType(cred.file_original_name) || response.headers?.['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', cred.file_original_name || `certificate-${cred.id}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch {
      showToast('Unable to download document file.', 'error');
    }
  }, [showToast]);

  const approvedCount = credentials.filter((c) => c.status === 'approved').length;
  const pendingCount = credentials.filter((c) => c.status === 'pending').length;
  const resubmitCount = credentials.filter((c) => c.status === 'resubmission_required' || c.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Formal Header */}
      <PageHeader
        eyebrow="Verification & Trust"
        title="Certificates & Credentials"
        description="Verify your professional qualifications to increase employer confidence in your profile."
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-ink-900">{approvedCount}</p>
            <p className="text-xs font-medium text-gray-500">Verified Credentials</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-ink-900">{pendingCount}</p>
            <p className="text-xs font-medium text-gray-500">Pending Review</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <RefreshCw className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-ink-900">{resubmitCount}</p>
            <p className="text-xs font-medium text-gray-500">Action Required</p>
          </div>
        </Card>
      </div>

      {/* Submissions Section Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink-900">Your Qualifications</h2>
          <p className="text-xs text-gray-500">Submit and track official DreamMore and recognized third-party certificates.</p>
        </div>
        <Button onClick={openNewSubmission} className="cursor-pointer">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add New Certificate
        </Button>
      </div>

      {/* Content List */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-card border border-gray-200 bg-white" />
          ))}
        </div>
      )}

      {error && (
        <ErrorState title="Unable to load credentials" description={error} onRetry={loadCredentials} />
      )}

      {!loading && !error && credentials.length === 0 && (
        <EmptyState
          icon={Award}
          title="No credentials submitted yet"
          description="Verify your qualifications to boost your profile score and gain instant job application authorization."
          action={
            <Button onClick={openNewSubmission} size="sm" className="cursor-pointer">
              <Upload className="h-4 w-4" aria-hidden="true" /> Add Your First Certificate
            </Button>
          }
        />
      )}

      {!loading && !error && credentials.length > 0 && (
        <div className="space-y-4">
          {credentials.map((cred) => {
            const statusInfo = STATUS_CONFIG[cred.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = statusInfo.icon;
            const isDreamMore = cred.type === 'dream_more_certificate' || cred.verification_source === 'dream_more_lms';
            const canEditResubmit = cred.status === 'pending' || cred.status === 'rejected' || cred.status === 'resubmission_required';

            return (
              <Card key={cred.id} className="p-5 overflow-hidden transition-all duration-200 hover:shadow-md">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    {/* Header line */}
                    <div className="flex flex-wrap items-center gap-2">
                      {isDreamMore ? (
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                          <Sparkles className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                          <Building2 className="h-4 w-4" />
                        </span>
                      )}
                      <h3 className="text-base font-bold text-ink-900">{cred.title}</h3>
                      <Badge tone={statusInfo.tone} size="sm" className="flex items-center gap-1">
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusInfo.label}
                      </Badge>
                      {isDreamMore && (
                        <Badge tone="success" size="xs">
                          DreamMore Verified
                        </Badge>
                      )}
                    </div>

                    {/* Metadata line */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
                      <div>
                        <span className="font-semibold text-gray-700">Issuer: </span>
                        {cred.issuing_organization || (isDreamMore ? 'DreamMore Platform' : 'Not specified')}
                      </div>
                      {cred.certificate_identifier && (
                        <div>
                          <span className="font-semibold text-gray-700">Certificate ID: </span>
                          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-800">
                            {cred.certificate_identifier}
                          </code>
                        </div>
                      )}
                      {cred.issue_date && (
                        <div>
                          <span className="font-semibold text-gray-700">Issued: </span>
                          {formatDate(cred.issue_date)}
                        </div>
                      )}
                      {cred.expiry_date && (
                        <div>
                          <span className="font-semibold text-gray-700">Expires: </span>
                          {formatDate(cred.expiry_date)}
                        </div>
                      )}
                    </div>

                    {cred.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 pt-1">{cred.description}</p>
                    )}

                    {/* Attached file info */}
                    {cred.file_original_name && (
                      <div className="flex items-center gap-2 pt-1 text-xs text-gray-500">
                        <FileText className="h-3.5 w-3.5 text-brand-600" />
                        <span className="font-medium text-gray-700">{cred.file_original_name}</span>
                      </div>
                    )}

                    {/* Feedback Callouts */}
                    {cred.status === 'resubmission_required' && cred.rejection_reason && (
                      <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50 p-3.5 text-xs text-purple-900 flex items-start gap-2.5">
                        <AlertCircle className="h-4 w-4 shrink-0 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-bold text-purple-900">Resubmission Instructions:</p>
                          <p className="mt-0.5 text-purple-800">{cred.rejection_reason}</p>
                        </div>
                      </div>
                    )}

                    {cred.status === 'rejected' && cred.rejection_reason && (
                      <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-900 flex items-start gap-2.5">
                        <XCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                        <div>
                          <p className="font-bold text-red-900">Rejection Reason:</p>
                          <p className="mt-0.5 text-red-800">{cred.rejection_reason}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:self-start">
                    {cred.file_path && (
                      <>
                        <Button variant="outline" size="xs" onClick={() => handlePreview(cred)} className="cursor-pointer">
                          <Eye className="h-3.5 w-3.5" /> Preview
                        </Button>
                        <Button variant="outline" size="xs" onClick={() => handleDownload(cred)} className="cursor-pointer">
                          <Download className="h-3.5 w-3.5" /> Download
                        </Button>
                      </>
                    )}

                    {canEditResubmit && (
                      <Button
                        variant={cred.status === 'resubmission_required' ? 'primary' : 'outline'}
                        size="xs"
                        onClick={() => openEditResubmit(cred)}
                        className="cursor-pointer"
                      >
                        {cred.status === 'resubmission_required' || cred.status === 'rejected' ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5" /> Edit & Resubmit
                          </>
                        ) : (
                          <>
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </>
                        )}
                      </Button>
                    )}

                    {canEditResubmit && (
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => setDeleteTarget(cred)}
                        className="cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 4-Step Certificate Submission Modal Wizard */}
      <Modal
        open={showWizardModal}
        onClose={() => {
          setShowWizardModal(false);
          resetForm();
        }}
        title={editingId ? 'Edit & Resubmit Certificate' : 'Certificate Submission Wizard'}
        description="Verify your professional qualification step-by-step."
        size="lg"
      >
        <div className="space-y-6">
          {/* Stepper Progress Bar */}
          <div className="border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
              <span className={cn(wizardStep >= 1 ? 'text-brand-600 font-bold' : '')}>1. Type</span>
              <span className={cn(wizardStep >= 2 ? 'text-brand-600 font-bold' : '')}>2. Information</span>
              {form.type === 'external_certificate' && (
                <span className={cn(wizardStep >= 3 ? 'text-brand-600 font-bold' : '')}>3. Document</span>
              )}
              <span className={cn(wizardStep >= 4 ? 'text-brand-600 font-bold' : '')}>4. Review & Submit</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-all duration-300 ease-out"
                style={{
                  width: `${
                    form.type === 'dream_more_certificate'
                      ? wizardStep === 1
                        ? 33
                        : wizardStep === 2
                        ? 66
                        : 100
                      : (wizardStep / 4) * 100
                  }%`,
                }}
              />
            </div>
          </div>

          {/* STEP 1: Certificate Type */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-ink-900">Step 1 — Choose Certificate Type</h3>
                <p className="text-xs text-gray-500">
                  Select whether you are verifying an official DreamMore course certificate or an external organization qualification.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {CREDENTIAL_TYPES.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = form.type === opt.value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => setForm({ ...form, type: opt.value, document: null, certificate_identifier: '', issuing_organization: opt.value === 'dream_more_certificate' ? 'DreamMore' : '' })}
                      className={cn(
                        'relative flex flex-col justify-between rounded-xl border-2 p-5 cursor-pointer transition-all duration-200',
                        isSelected
                          ? 'border-brand-500 bg-brand-50/60 shadow-md ring-2 ring-brand-500/20'
                          : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-gray-50/50',
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <div
                          className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-xl',
                            isSelected ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600',
                          )}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <h4 className="mt-3 text-base font-bold text-ink-900">{opt.label}</h4>
                        <p className="mt-1 text-xs font-medium text-brand-700">{opt.tagline}</p>
                        <p className="mt-2 text-xs text-gray-500 leading-relaxed">{opt.description}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                        <span>{opt.badge}</span>
                        <span className="text-brand-600 font-bold flex items-center gap-1">
                          Select <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Certificate Information */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-ink-900">
                  Step 2 — {form.type === 'dream_more_certificate' ? 'DreamMore Certificate Verification' : 'External Certificate Details'}
                </h3>
                <p className="text-xs text-gray-500">Provide the required certificate identifiers and details.</p>
              </div>

              {form.type === 'dream_more_certificate' ? (
                <div className="space-y-4 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                      <Key className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-brand-900">DreamMore Certificate Lookup</p>
                      <p className="text-xs text-brand-700">
                        Enter your Certificate ID issued by the DreamMore LMS platform.
                      </p>
                    </div>
                  </div>

                  <Input
                    label="Certificate ID *"
                    placeholder="e.g. DM-WD-2024-001"
                    value={form.certificate_identifier}
                    onChange={(e) => setForm({ ...form, certificate_identifier: e.target.value })}
                    error={formErrors.certificate_identifier}
                    required
                  />

                  {/* Help text */}
                  <div className="rounded-lg bg-white p-3 text-xs text-gray-600 border border-brand-100 flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 shrink-0 text-brand-500 mt-0.5" />
                    <div>
                      <strong className="text-gray-900">Where to find your Certificate ID:</strong>
                      <p className="mt-0.5 text-gray-600">
                        Log into your DreamMore student account and view your course completion certificate badge or certificate settings.
                      </p>
                    </div>
                  </div>

                  <Input
                    label="Certificate Title (Optional override)"
                    placeholder="e.g. Full Stack Web Development Mastery"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    error={formErrors.title}
                  />

                  <Textarea
                    label="Description (Optional)"
                    placeholder="Brief details about your course completion..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <Input
                    label="Certificate Name / Title *"
                    placeholder="e.g. AWS Certified Solutions Architect - Associate"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    error={formErrors.title}
                    required
                  />

                  <Input
                    label="Issuing Organization *"
                    placeholder="e.g. Amazon Web Services, Google, Coursera"
                    value={form.issuing_organization}
                    onChange={(e) => setForm({ ...form, issuing_organization: e.target.value })}
                    error={formErrors.issuing_organization}
                    required
                  />

                  <Input
                    label="Certificate ID / License Number (Optional)"
                    placeholder="e.g. AWS-ASA-2024-98765"
                    value={form.certificate_identifier}
                    onChange={(e) => setForm({ ...form, certificate_identifier: e.target.value })}
                    error={formErrors.certificate_identifier}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      type="date"
                      label="Issue Date"
                      value={form.issue_date}
                      onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                      error={formErrors.issue_date}
                    />
                    <Input
                      type="date"
                      label="Expiration Date (Optional)"
                      value={form.expiry_date}
                      onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                      error={formErrors.expiry_date}
                    />
                  </div>

                  <Textarea
                    label="Description"
                    placeholder="Brief description of skills verified by this certificate..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Supporting Document (External Certificate Only) */}
          {wizardStep === 3 && form.type === 'external_certificate' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-ink-900">Step 3 — Upload Supporting Document</h3>
                <p className="text-xs text-gray-500">Provide an official copy or photo of your certificate for review.</p>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer',
                  isDragging
                    ? 'border-brand-500 bg-brand-50'
                    : form.document
                    ? 'border-green-300 bg-green-50/30'
                    : 'border-gray-300 bg-gray-50/50 hover:border-gray-400 hover:bg-gray-50',
                )}
              >
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileInput}
                  className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                />

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm text-brand-600 mb-3">
                  <Upload className="h-7 w-7" />
                </div>

                <p className="text-sm font-bold text-ink-900">
                  Drag and drop your certificate here or <span className="text-brand-600 underline">browse files</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">Supported formats: PDF, JPG, PNG (Max 10 MB)</p>
              </div>

              {/* Progress Indicator */}
              {isUploadingFile && (
                <div className="space-y-1.5 rounded-xl bg-gray-50 p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                    <span>Reading document file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-brand-500 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Selected File Card */}
              {form.document && !isUploadingFile && (
                <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {filePreviewUrl ? (
                      <img src={filePreviewUrl} alt="Certificate Preview" className="h-12 w-12 rounded-lg object-cover border" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-700 font-bold">
                        <FileCheck className="h-6 w-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink-900 truncate">{form.document.name}</p>
                      <p className="text-[11px] text-gray-500">{formatBytes(form.document.size)}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 mt-0.5">
                        <CheckCircle className="h-3 w-3" /> Ready for submission
                      </span>
                    </div>
                  </div>

                  <Button variant="outline" size="xs" onClick={removeSelectedFile} className="cursor-pointer text-danger-600">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              )}

              {formErrors.document && (
                <p role="alert" className="text-xs font-medium text-danger-600">
                  {formErrors.document}
                </p>
              )}
            </div>
          )}

          {/* STEP 4: Review & Submit */}
          {wizardStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-ink-900">Step 4 — Review Summary & Submit</h3>
                <p className="text-xs text-gray-500">
                  Verify your information below before submitting for verification.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-xs font-semibold text-gray-500">Certificate Type</span>
                  <Badge tone={form.type === 'dream_more_certificate' ? 'success' : 'neutral'} size="sm">
                    {form.type === 'dream_more_certificate' ? 'DreamMore Certificate' : 'External Certificate'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-gray-500 font-medium">Certificate Title</p>
                    <p className="text-sm font-bold text-ink-900 mt-0.5">{form.title}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Issuing Organization</p>
                    <p className="text-sm font-bold text-ink-900 mt-0.5">
                      {form.type === 'dream_more_certificate' ? 'DreamMore Platform' : form.issuing_organization}
                    </p>
                  </div>

                  {form.certificate_identifier && (
                    <div>
                      <p className="text-gray-500 font-medium">Certificate ID</p>
                      <p className="text-sm font-mono font-bold text-ink-900 mt-0.5">{form.certificate_identifier}</p>
                    </div>
                  )}

                  {form.issue_date && (
                    <div>
                      <p className="text-gray-500 font-medium">Issue Date</p>
                      <p className="text-sm font-bold text-ink-900 mt-0.5">{form.issue_date}</p>
                    </div>
                  )}

                  {form.expiry_date && (
                    <div>
                      <p className="text-gray-500 font-medium">Expiration Date</p>
                      <p className="text-sm font-bold text-ink-900 mt-0.5">{form.expiry_date}</p>
                    </div>
                  )}
                </div>

                {form.document && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-500 font-medium mb-1">Uploaded Document</p>
                    <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      <FileText className="h-4 w-4 text-brand-600" />
                      <span className="font-bold">{form.document.name}</span>
                      <span className="text-gray-400">({formatBytes(form.document.size)})</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stepper Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {wizardStep > 1 ? (
              <Button type="button" variant="outline" onClick={handlePrevStep} className="cursor-pointer">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <div />
            )}

            {wizardStep < 4 ? (
              <Button type="button" onClick={handleNextStep} className="cursor-pointer">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                loading={submitting}
                className="cursor-pointer bg-brand-600 hover:bg-brand-700 text-white"
              >
                Submit for Verification
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Remove Credential"
        description={`Are you sure you want to remove "${deleteTarget?.title}"?`}
        size="sm"
      >
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="cursor-pointer">
            Cancel
          </Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete} className="cursor-pointer">
            Remove
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
