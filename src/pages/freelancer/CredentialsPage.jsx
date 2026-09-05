import { useCallback, useEffect, useState } from 'react';
import {
  Award, FileText, Plus, Trash2, Pencil, CheckCircle, XCircle, Clock,
  Upload, Key, Building2, Sparkles, RefreshCw, Eye, Download,
  ArrowRight, ArrowLeft, AlertCircle, HelpCircle, FileCheck, Check, Shield,
  Calendar, Globe, Award as AwardIcon, Info, ChevronRight, Star,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import DocumentPreview from '../../components/ui/DocumentPreview';
import { credentialService } from '../../services/credentialService';
import { verificationService } from '../../services/verificationService';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../utils/cn';

const CREDENTIAL_TYPES = [
  {
    value: 'dream_more_certificate',
    label: 'DreamMore Certificate',
    tagline: 'Official certificate issued by DreamMore',
    icon: Sparkles,
    badge: 'DreamMore Official',
    color: 'brand',
    description: 'Verify certificates earned through DreamMore learning platform using your Certificate ID.',
  },
  {
    value: 'external_certificate',
    label: 'External Certificate',
    tagline: 'Certificate issued by another organization',
    icon: Building2,
    badge: 'External Issuer',
    color: 'blue',
    description: 'Upload credentials, diplomas, or certificates from external institutions or providers.',
  },
];

const STATUS_CONFIG = {
  pending: { icon: Clock, tone: 'warning', label: 'Pending Review', description: 'Being reviewed by our verification team.' },
  approved: { icon: CheckCircle, tone: 'success', label: 'Verified', description: 'Verified and visible on your profile.' },
  rejected: { icon: XCircle, tone: 'danger', label: 'Rejected', description: 'Did not meet verification criteria.' },
  resubmission_required: { icon: RefreshCw, tone: 'purple', label: 'Resubmit Required', description: 'Update your submission per admin feedback.' },
};

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

function getMimeType(fileName) {
  if (!fileName) return null;
  const ext = fileName.split('.').pop().toLowerCase();
  return { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[ext] || null;
}

const INITIAL_FORM = {
  title: '', type: 'dream_more_certificate', issuing_organization: '',
  certificate_identifier: '', description: '', issue_date: '', expiry_date: '', document: null,
  verification_type: 'identity', verification_document: null, verification_notes: '',
};

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: Step Indicator
   ═══════════════════════════════════════════════════════════════════════════ */
function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const isActive = currentStep === stepNum;
        const isCompleted = currentStep > stepNum;
        return (
          <div key={stepNum} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300',
                isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' :
                isActive ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 scale-110' :
                'bg-gray-100 text-gray-400'
              )}>
                {isCompleted ? <Check className="h-5 w-5" /> : stepNum}
              </div>
              <span className={cn(
                'mt-2 text-[10px] font-semibold transition-colors',
                isActive ? 'text-brand-600' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
              )}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'mx-2 h-0.5 w-8 sm:w-12 transition-colors duration-300',
                isCompleted ? 'bg-emerald-400' : 'bg-gray-200'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN: Credentials Page
   ═══════════════════════════════════════════════════════════════════════════ */
export default function CredentialsPage() {
  usePageTitle('Certificates & Credentials');
  const { showToast } = useToast();

  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [previewTarget, setPreviewTarget] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadCredentials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await credentialService.getMyCredentials();
      if (response.success) setCredentials(response.data ?? []);
      else setError(response.message || 'Unable to load credentials.');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load credentials.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCredentials(); }, [loadCredentials]);
  useEffect(() => () => { if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl); }, [filePreviewUrl]);

  const resetForm = () => {
    setForm(INITIAL_FORM); setFormErrors({}); setEditingId(null); setWizardStep(1);
    setUploadProgress(0); setIsUploadingFile(false);
    if (filePreviewUrl) { URL.revokeObjectURL(filePreviewUrl); setFilePreviewUrl(null); }
  };

  const openNewSubmission = () => { resetForm(); setShowWizardModal(true); };

  const openEditResubmit = (cred) => {
    setEditingId(cred.id);
    setForm({ ...INITIAL_FORM, title: cred.title ?? '', type: cred.type ?? 'external_certificate', issuing_organization: cred.issuing_organization ?? '', certificate_identifier: cred.certificate_identifier ?? '', description: cred.description ?? '', issue_date: cred.issue_date ?? '', expiry_date: cred.expiry_date ?? '' });
    setFormErrors({}); setWizardStep(2); setShowWizardModal(true);
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) processFile(file); };
  const handleFileInput = (e) => { const file = e.target.files?.[0]; if (file) processFile(file); };

  const processFile = (file) => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) { setFormErrors({ ...formErrors, document: 'Invalid file type. Use PDF, JPG, PNG, or WebP.' }); return; }
    if (file.size > MAX_FILE_SIZE_BYTES) { setFormErrors({ ...formErrors, document: 'File too large. Maximum size is 10 MB.' }); return; }
    setIsUploadingFile(true); setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => { if (prev >= 100) { clearInterval(interval); setIsUploadingFile(false); return 100; } return prev + 20; });
    }, 100);
    setForm({ ...form, document: file });
    if (file.type.startsWith('image/')) { setFilePreviewUrl(URL.createObjectURL(file)); } else { setFilePreviewUrl(null); }
  };

  const removeSelectedFile = () => { setForm({ ...form, document: null }); if (filePreviewUrl) { URL.revokeObjectURL(filePreviewUrl); setFilePreviewUrl(null); } };

  const handleVerificationFileInput = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_MIME_TYPES.includes(file.type)) { setFormErrors({ ...formErrors, verification_document: 'Invalid file type.' }); return; }
    if (file.size > MAX_FILE_SIZE_BYTES) { setFormErrors({ ...formErrors, verification_document: 'File too large. Max 10 MB.' }); return; }
    setForm({ ...form, verification_document: file });
  };
  const removeVerificationFile = () => { setForm({ ...form, verification_document: null }); };

  const validateStep1 = () => { if (!form.type) { setFormErrors({ type: 'Please select a certificate type.' }); return false; } setFormErrors({}); return true; };
  const validateStep2 = () => {
    const errs = {};
    if (form.type === 'dream_more_certificate') {
      if (!form.certificate_identifier?.trim()) errs.certificate_identifier = 'Certificate ID is required.';
    } else {
      if (!form.title?.trim()) errs.title = 'Certificate title is required.';
      if (!form.issuing_organization?.trim()) errs.issuing_organization = 'Issuing organization is required.';
    }
    setFormErrors(errs); return Object.keys(errs).length === 0;
  };
  const validateStep3 = () => {
    if (form.type === 'external_certificate' && !form.document && !editingId) { setFormErrors({ document: 'Please upload a supporting document.' }); return false; }
    setFormErrors({}); return true;
  };

  const getSteps = () => {
    if (form.type === 'external_certificate') {
      return [
        { label: 'Type' }, { label: 'Details' }, { label: 'Document' }, { label: 'Verify' }, { label: 'Review' },
      ];
    }
    return [
      { label: 'Type' }, { label: 'Details' }, { label: 'Review' },
    ];
  };

  const getTotalSteps = () => form.type === 'external_certificate' ? 5 : 3;

  const handleNextStep = () => {
    const total = getTotalSteps();
    if (wizardStep === 1 && validateStep1()) { setWizardStep(2); }
    else if (wizardStep === 2 && validateStep2()) { setWizardStep(3); }
    else if (wizardStep === 3 && form.type === 'external_certificate' && validateStep3()) { setWizardStep(4); }
    else if (wizardStep < total) { setWizardStep(wizardStep + 1); }
  };

  const handlePrevStep = () => { if (wizardStep > 1) setWizardStep(wizardStep - 1); };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true); setFormErrors({});
    try {
      const formData = new FormData();
      formData.append('title', form.title || (form.type === 'dream_more_certificate' ? 'DreamMore Certificate' : 'External Certificate'));
      formData.append('type', form.type);
      formData.append('description', form.description || '');
      if (form.type === 'dream_more_certificate') { formData.append('certificate_identifier', form.certificate_identifier.trim()); formData.append('issuing_organization', 'DreamMore'); }
      else { if (form.document) formData.append('document', form.document); if (form.issuing_organization) formData.append('issuing_organization', form.issuing_organization.trim()); if (form.certificate_identifier) formData.append('certificate_identifier', form.certificate_identifier.trim()); }
      if (form.issue_date) formData.append('issue_date', form.issue_date);
      if (form.expiry_date) formData.append('expiry_date', form.expiry_date);
      if (editingId) { if (!form.document && form.type === 'external_certificate') formData.delete('document'); await credentialService.updateCredential(editingId, formData); showToast('Certificate resubmitted!', 'success'); }
      else { await credentialService.createCredential(formData); showToast('Certificate submitted for verification.', 'success'); }

      // Identity verification is only required for external certificates;
      // DreamMore certificates are already verified through the DreamMore LMS.
      if (form.type === 'external_certificate' && form.verification_document) {
        try {
          const verifFormData = new FormData();
          verifFormData.append('type', 'identity');
          verifFormData.append('document', form.verification_document);
          if (form.verification_notes?.trim()) verifFormData.append('notes', form.verification_notes.trim());
          await verificationService.submitVerification(verifFormData);
          showToast('Identity document submitted successfully.', 'success');
        } catch (vErr) {
          console.warn('Identity verification skipped:', vErr?.message);
        }
      }

      setShowWizardModal(false); resetForm(); loadCredentials();
    } catch (err) {
      if (err?.response?.status === 422) { setFormErrors(err.response.data?.errors ?? {}); showToast(getErrorMessage(err, 'Validation failed.'), 'error'); }
      else showToast(getErrorMessage(err, 'Submission failed.'), 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return; setDeleting(true);
    try { await credentialService.deleteCredential(deleteTarget.id); showToast('Credential removed.', 'success'); setDeleteTarget(null); loadCredentials(); }
    catch (err) { showToast(getErrorMessage(err, 'Failed to remove.'), 'error'); }
    finally { setDeleting(false); }
  };

  const handlePreview = useCallback(async (cred) => {
    setPreviewLoading(true); setPreviewTarget(cred);
    try {
      const response = await adminService.downloadCredential(cred.id);
      const contentType = response.headers?.['content-type'] || '';
      if (contentType.includes('application/json') || !response.data || response.data.size === 0) { setPreviewUrl(null); return; }
      const mime = getMimeType(cred.file_original_name) || contentType || 'application/pdf';
      const blob = new Blob([response.data], { type: mime });
      setPreviewUrl(window.URL.createObjectURL(blob));
    } catch { setPreviewUrl(null); }
    finally { setPreviewLoading(false); }
  }, []);

  const handleDownload = useCallback(async (cred) => {
    try {
      const response = await credentialService.downloadCredential(cred.id);
      const contentType = response.headers?.['content-type'] || '';
      if (!response.data || response.data.size === 0) { showToast('This certificate has no file attached.', 'warning'); return; }
      const mime = getMimeType(cred.file_original_name) || contentType || 'application/octet-stream';
      const blob = new Blob([response.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = cred.file_original_name || `certificate-${cred.id}`;
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) { showToast(err?.response?.data?.message || 'Unable to download.', 'error'); }
  }, [showToast]);

  const approvedCount = credentials.filter((c) => c.status === 'approved').length;
  const pendingCount = credentials.filter((c) => c.status === 'pending').length;
  const resubmitCount = credentials.filter((c) => c.status === 'resubmission_required' || c.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-ink-900 to-ink-800 p-6 lg:p-8 text-white">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <Shield className="h-6 w-6 text-brand-300" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Certificates & Credentials</h1>
            <p className="mt-1 text-sm text-gray-300 max-w-xl">
              Verify your professional qualifications to increase employer confidence and unlock job application permissions.
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><CheckCircle className="h-6 w-6" /></div>
          <div><p className="text-2xl font-extrabold text-emerald-900">{approvedCount}</p><p className="text-xs font-medium text-emerald-700">Verified</p></div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><Clock className="h-6 w-6" /></div>
          <div><p className="text-2xl font-extrabold text-amber-900">{pendingCount}</p><p className="text-xs font-medium text-amber-700">Pending Review</p></div>
        </div>
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600"><RefreshCw className="h-6 w-6" /></div>
          <div><p className="text-2xl font-extrabold text-purple-900">{resubmitCount}</p><p className="text-xs font-medium text-purple-700">Action Required</p></div>
        </div>
      </div>

      {/* ── Section Header ──────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-lg font-bold text-ink-900">Your Qualifications</h2><p className="text-xs text-gray-500">Submit and track your professional certificates.</p></div>
        <Button onClick={openNewSubmission}><Plus className="h-4 w-4" /> Add Certificate</Button>
      </div>

      {/* ── Loading / Error / Empty ──────────────────────────── */}
      {loading && <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white" />)}</div>}
      {error && <ErrorState title="Unable to load credentials" description={error} onRetry={loadCredentials} />}

      {!loading && !error && credentials.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Award className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-base font-bold text-ink-900">No credentials yet</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">Add your professional certificates to boost your profile and gain job application access.</p>
          <Button onClick={openNewSubmission} size="sm" className="mt-4"><Plus className="h-4 w-4" /> Add Your First Certificate</Button>
        </div>
      )}

      {/* ── Credentials List ─────────────────────────────────── */}
      {!loading && !error && credentials.length > 0 && (
        <div className="space-y-3">
          {credentials.map((cred) => {
            const statusInfo = STATUS_CONFIG[cred.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = statusInfo.icon;
            const isDreamMore = cred.type === 'dream_more_certificate' || cred.verification_source === 'dream_more_lms';
            const canEditResubmit = cred.status === 'pending' || cred.status === 'rejected' || cred.status === 'resubmission_required';
            return (
              <div key={cred.id} className="rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-md transition-all duration-200">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('flex h-8 w-8 items-center justify-center rounded-xl', isDreamMore ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600')}>
                        {isDreamMore ? <Sparkles className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                      </span>
                      <h3 className="text-sm font-bold text-ink-900">{cred.title}</h3>
                      <Badge tone={statusInfo.tone} size="xs" className="flex items-center gap-1"><StatusIcon className="h-3 w-3" /> {statusInfo.label}</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-gray-600 pl-10">
                      <div><span className="text-gray-400">Issuer: </span><span className="font-medium text-ink-700">{cred.issuing_organization || (isDreamMore ? 'DreamMore' : '—')}</span></div>
                      {cred.certificate_identifier && <div><span className="text-gray-400">ID: </span><code className="font-mono text-ink-700 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">{cred.certificate_identifier}</code></div>}
                      {cred.issue_date && <div><span className="text-gray-400">Issued: </span>{formatDate(cred.issue_date)}</div>}
                      {cred.expiry_date && <div><span className="text-gray-400">Expires: </span>{formatDate(cred.expiry_date)}</div>}
                    </div>
                    {cred.status === 'resubmission_required' && cred.rejection_reason && (
                      <div className="ml-10 mt-2 rounded-xl border border-purple-200 bg-purple-50 p-3 text-xs text-purple-900 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-purple-500 mt-0.5" />
                        <div><p className="font-bold">Resubmit Instructions:</p><p className="mt-0.5 text-purple-700">{cred.rejection_reason}</p></div>
                      </div>
                    )}
                    {cred.status === 'rejected' && cred.rejection_reason && (
                      <div className="ml-10 mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900 flex items-start gap-2">
                        <XCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                        <div><p className="font-bold">Rejection Reason:</p><p className="mt-0.5 text-red-700">{cred.rejection_reason}</p></div>
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:self-start">
                    {cred.file_path && (<>
                      <Button variant="outline" size="xs" onClick={() => handlePreview(cred)}><Eye className="h-3.5 w-3.5" /> Preview</Button>
                      <Button variant="outline" size="xs" onClick={() => handleDownload(cred)}><Download className="h-3.5 w-3.5" /> Download</Button>
                    </>)}
                    {canEditResubmit && (
                      <Button variant={cred.status === 'resubmission_required' ? 'primary' : 'outline'} size="xs" onClick={() => openEditResubmit(cred)}>
                        {cred.status === 'resubmission_required' || cred.status === 'rejected' ? <><RefreshCw className="h-3.5 w-3.5" /> Resubmit</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                      </Button>
                    )}
                    {canEditResubmit && <Button variant="danger" size="xs" onClick={() => setDeleteTarget(cred)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         WIZARD MODAL — Advanced Professional UI
         ═══════════════════════════════════════════════════════════════════ */}
      <Modal open={showWizardModal} onClose={() => { setShowWizardModal(false); resetForm(); }} title={editingId ? 'Edit & Resubmit Certificate' : 'Add Certificate'} size="lg">
        <div className="space-y-6">
          {/* Step Indicator */}
          <StepIndicator steps={getSteps()} currentStep={wizardStep} />

          {/* Step 1: Type */}
          {wizardStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-ink-900">Choose Certificate Type</h3>
                <p className="text-sm text-gray-500 mt-1">Select the type of certificate you want to add</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CREDENTIAL_TYPES.map((ct) => (
                  <button key={ct.value} type="button" onClick={() => { setForm({ ...form, type: ct.value }); setFormErrors({}); }}
                    className={cn(
                      'group relative rounded-2xl border-2 p-6 text-left transition-all duration-300 cursor-pointer',
                      form.type === ct.value
                        ? 'border-brand-500 bg-brand-50/50 shadow-lg shadow-brand-100 ring-2 ring-brand-200'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    )}>
                    {form.type === ct.value && (
                      <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'flex h-14 w-14 items-center justify-center rounded-2xl transition-colors',
                        form.type === ct.value ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                      )}>
                        <ct.icon className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ink-900">{ct.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{ct.tagline}</p>
                        <span className={cn(
                          'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          ct.color === 'brand' ? 'bg-brand-100 text-brand-700' : 'bg-blue-100 text-blue-700'
                        )}>{ct.badge}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {formErrors.type && <p className="text-xs font-medium text-red-600">{formErrors.type}</p>}
            </div>
          )}

          {/* Step 2: Details */}
          {wizardStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-ink-900">{form.type === 'dream_more_certificate' ? 'DreamMore Certificate Details' : 'Certificate Details'}</h3>
                <p className="text-sm text-gray-500 mt-1">{form.type === 'dream_more_certificate' ? 'Enter your DreamMore certificate ID to verify' : 'Provide details about your certificate'}</p>
              </div>
              {form.type === 'dream_more_certificate' ? (
                <div className="space-y-5 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-brand-100/50 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white"><Key className="h-5 w-5" /></div>
                    <div><p className="text-sm font-bold text-ink-900">Certificate Verification</p><p className="text-xs text-brand-600">Enter your unique certificate ID</p></div>
                  </div>
                  <Input label="Certificate ID *" placeholder="e.g. DM-WD-2024-001" value={form.certificate_identifier} onChange={(e) => setForm({ ...form, certificate_identifier: e.target.value })} error={formErrors.certificate_identifier} required />
                  <Input label="Certificate Title (Optional)" placeholder="e.g. Full Stack Web Development" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={formErrors.title} />
                  <Textarea label="Description (Optional)" placeholder="Brief details about your completion..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-gray-200 bg-white p-6">
                    <Input label="Certificate Title *" placeholder="e.g. AWS Certified Solutions Architect" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={formErrors.title} required />
                    <div className="mt-4"><Input label="Issuing Organization *" placeholder="e.g. Amazon Web Services, Google" value={form.issuing_organization} onChange={(e) => setForm({ ...form, issuing_organization: e.target.value })} error={formErrors.issuing_organization} required /></div>
                    <div className="mt-4"><Input label="Certificate ID (Optional)" placeholder="e.g. AWS-ASA-2024-98765" value={form.certificate_identifier} onChange={(e) => setForm({ ...form, certificate_identifier: e.target.value })} error={formErrors.certificate_identifier} /></div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input type="date" label="Issue Date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} error={formErrors.issue_date} />
                      <Input type="date" label="Expiry Date (Optional)" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} error={formErrors.expiry_date} />
                    </div>
                    <div className="mt-4"><Textarea label="Description" placeholder="Skills verified by this certificate..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Document Upload (External only) */}
          {wizardStep === 3 && form.type === 'external_certificate' && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-ink-900">Upload Certificate</h3>
                <p className="text-sm text-gray-500 mt-1">Upload a clear photo or PDF of your certificate</p>
              </div>
              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all',
                  isDragging ? 'border-brand-500 bg-brand-50 scale-[1.02]' : form.document ? 'border-green-300 bg-green-50/30' : 'border-gray-300 bg-gray-50/50 hover:border-brand-400 hover:bg-brand-50/20'
                )}>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileInput} className="absolute inset-0 z-10 opacity-0 cursor-pointer" />
                {form.document ? (
                  <div className="flex flex-col items-center">
                    <FileCheck className="h-12 w-12 text-green-500 mb-3" />
                    <p className="text-sm font-bold text-ink-900">{form.document.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatBytes(form.document.size)}</p>
                    <Button variant="outline" size="xs" className="mt-3" onClick={(e) => { e.stopPropagation(); removeSelectedFile(); }}>Remove</Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-sm font-bold text-ink-900">Drag & drop or <span className="text-brand-600 underline">browse</span></p>
                    <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG — Max 10 MB</p>
                  </div>
                )}
              </div>
              {isUploadingFile && <div className="rounded-xl bg-gray-50 p-3"><div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden"><div className="h-full bg-brand-500 transition-all" style={{ width: `${uploadProgress}%` }} /></div></div>}
              {formErrors.document && <p className="text-xs font-medium text-red-600">{formErrors.document}</p>}
            </div>
          )}

          {/* Step 4 (External only): Identity Verification */}
          {wizardStep === 4 && form.type === 'external_certificate' && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-ink-900">Identity Verification</h3>
                <p className="text-sm text-gray-500 mt-1">Upload your identity document to build trust with employers</p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white"><Shield className="h-5 w-5" /></div>
                  <div><p className="text-sm font-bold text-blue-900">Why is this required?</p><p className="text-xs text-blue-700">Identity verification helps employers trust your profile and increases your chances of winning projects.</p></div>
                </div>
              </div>
              <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-all relative">
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleVerificationFileInput} className="absolute inset-0 z-10 opacity-0 cursor-pointer" />
                {form.verification_document ? (
                  <div className="flex flex-col items-center">
                    <FileCheck className="h-12 w-12 text-green-500 mb-3" />
                    <p className="text-sm font-bold text-ink-900">{form.verification_document.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatBytes(form.verification_document.size)}</p>
                    <Button variant="outline" size="xs" className="mt-3" onClick={(e) => { e.stopPropagation(); removeVerificationFile(); }}>Remove</Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-sm font-bold text-ink-900">Upload Identity Document</p>
                    <p className="text-xs text-gray-500 mt-1">Passport, National ID, or Driver's License — PDF, JPG, PNG, Max 10 MB</p>
                  </div>
                )}
              </div>
              {formErrors.verification_document && <p className="text-xs font-medium text-red-600">{formErrors.verification_document}</p>}
              <Textarea label="Notes (Optional)" placeholder="Any additional notes about your identity verification..." value={form.verification_notes} onChange={(e) => setForm({ ...form, verification_notes: e.target.value })} rows={2} />
            </div>
          )}

          {/* Step 3 (DreamMore) / Step 5 (External): Review */}
          {wizardStep === (form.type === 'external_certificate' ? 5 : 3) && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-ink-900">Review & Submit</h3>
                <p className="text-sm text-gray-500 mt-1">Please review your information before submitting</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    {form.type === 'dream_more_certificate' ? <Sparkles className="h-5 w-5 text-white" /> : <Building2 className="h-5 w-5 text-white" />}
                    <span className="text-sm font-bold text-white">{form.type === 'dream_more_certificate' ? 'DreamMore Certificate' : 'External Certificate'}</span>
                  </div>
                </div>
                <div className="p-6 space-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Title</span><span className="font-bold text-ink-900">{form.title || 'DreamMore Certificate'}</span></div>
                  <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Issuer</span><span className="font-medium text-ink-700">{form.type === 'dream_more_certificate' ? 'DreamMore' : form.issuing_organization}</span></div>
                  {form.certificate_identifier && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Certificate ID</span><code className="font-mono text-ink-700 bg-gray-100 px-2 py-0.5 rounded">{form.certificate_identifier}</code></div>}
                  {form.issue_date && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Issue Date</span><span className="text-ink-700">{form.issue_date}</span></div>}
                  {form.expiry_date && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Expiry Date</span><span className="text-ink-700">{form.expiry_date}</span></div>}
                  {form.document && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Certificate File</span><span className="font-bold text-emerald-600">✓ {form.document.name}</span></div>}
                  {form.verification_document && <div className="flex justify-between py-2"><span className="text-gray-500">Identity Document</span><span className="font-bold text-emerald-600">✓ {form.verification_document.name}</span></div>}
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {wizardStep > 1 ? <Button type="button" variant="outline" onClick={handlePrevStep}><ArrowLeft className="h-4 w-4" /> Back</Button> : <div />}
            {wizardStep < getTotalSteps() ? <Button type="button" onClick={handleNextStep}>Next <ArrowRight className="h-4 w-4" /></Button>
              : <Button type="button" onClick={handleSubmit} loading={submitting} className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle className="h-4 w-4" /> Submit for Verification</Button>}
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Remove Credential" size="sm">
        <p className="text-sm text-gray-600">Remove <strong>{deleteTarget?.title}</strong>?</p>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>Remove</Button>
        </div>
      </Modal>

      <DocumentPreview open={Boolean(previewTarget)} onClose={() => { if (previewUrl?.startsWith('blob:')) window.URL.revokeObjectURL(previewUrl); setPreviewTarget(null); setPreviewUrl(null); }} fileName={previewTarget?.file_original_name} fileType={getMimeType(previewTarget?.file_original_name)} downloadUrl={previewUrl} loading={previewLoading} onDownload={previewTarget ? () => handleDownload(previewTarget) : undefined} />
    </div>
  );
}
