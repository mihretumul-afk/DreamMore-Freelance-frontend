import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle, XCircle, RefreshCw, FileText, Award, Download, Eye, User as UserIcon, Globe, ExternalLink, Clock, DollarSign, Star, Briefcase, Code } from 'lucide-react';
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
import { formatDate, formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';
import { API_ORIGIN } from '../../config/env';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'resubmission_required', label: 'Resubmission Required' },
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
  resubmission_required: 'purple',
};

/** Build absolute storage URL for avatar or document files */
function getFullStorageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!cleanPath.startsWith('/storage/')) {
    return `${API_ORIGIN}/storage${cleanPath}`;
  }
  return `${API_ORIGIN}${cleanPath}`;
}

/** Get MIME type from file name extension */
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

  // Approval / Rejection modal state
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject' | 'resubmit'
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Full detail preview modal state
  const [detailTarget, setDetailTarget] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFreelancerProfile, setDetailFreelancerProfile] = useState(null);

  // Document preview modal state
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
        } else if (actionType === 'resubmit') {
          await adminService.requestCredentialResubmission(actionTarget.id, rejectReason);
          showToast('Resubmission requested.', 'info');
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
      setDetailTarget(null);
      loadVerifications();
    } catch (err) {
      showToast(getErrorMessage(err, 'Action failed. Please try again.'), 'error');
    } finally {
      setProcessing(false);
    }
  };

  /** Open full detail preview modal for a verification/credential item */
  const handleOpenDetail = async (item) => {
    setDetailTarget(item);
    setDetailLoading(true);
    setDetailFreelancerProfile(null);
    try {
      const res = await adminService.getFreelancerByUserId(item.user_id);
      if (res?.success && res?.data) {
        setDetailFreelancerProfile(res.data);
      }
    } catch (err) {
      console.error('Error loading freelancer detail profile:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  /** Open DocumentPreview modal for a certificate file or identity doc */
  const handleDocumentPreview = async (item, directUrl = null) => {
    const targetItem = item || { title: 'Identity Verification Document', document_url: directUrl };
    setPreviewTarget(targetItem);
    setPreviewLoading(true);
    setPreviewUrl(null);
    try {
      if (directUrl) {
        setPreviewUrl(getFullStorageUrl(directUrl));
      } else if (item?.item_type === 'credential' || item?.file_path) {
        const response = await adminService.downloadCredential(item.id);
        const mime = getMimeType(item.file_original_name) || 'application/pdf';
        const blob = new Blob([response.data], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        setPreviewUrl(blobUrl);
      } else if (item?.document_url) {
        setPreviewUrl(getFullStorageUrl(item.document_url));
      } else {
        showToast('No previewable document file attached.', 'info');
      }
    } catch (err) {
      showToast('Unable to load document for preview.', 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  /** Trigger credential file download */
  const handleDownloadCredentialFile = async (item) => {
    try {
      const response = await adminService.downloadCredential(item.id);
      const mime = getMimeType(item.file_original_name) || 'application/octet-stream';
      const blob = new Blob([response.data], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.file_original_name || `credential_${item.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Download started.', 'success');
    } catch (err) {
      showToast('Unable to download credential file.', 'error');
    }
  };

  /** Generate and download full PDF profile report */
  const handleExportPDF = async (userId) => {
    try {
      const response = await adminService.getFreelancerByUserId(userId);
      if (response?.success && response?.data?.profile) {
        const { generateFreelancerProfilePDF } = await import('../../utils/freelancerPdfExport');
        await generateFreelancerProfilePDF(response.data);
        showToast('PDF downloaded successfully.', 'success');
      } else {
        showToast('Freelancer profile data is incomplete.', 'error');
      }
    } catch (err) {
      console.error('Export PDF error:', err);
      showToast('Unable to generate PDF.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Verifications</h1>
        <p className="text-sm text-gray-500">Review identity verifications and credential submissions with merged freelancer profile details.</p>
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
            <div key={i} className="h-24 animate-pulse rounded-card border border-gray-200 bg-white" />
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
            const avatarUrl = getFullStorageUrl(v.user?.avatar || v.user?.freelancer_profile?.avatar);
            const userInitials = (v.user?.name || 'User').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

            return (
              <Card key={`${v.item_type}-${v.id}`}>
                <CardBody>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Circular Avatar Photo */}
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={v.user?.name || 'Freelancer'}
                          className="h-11 w-11 rounded-full object-cover border border-gray-200 shrink-0 shadow-xs"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`h-11 w-11 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0 border border-brand-200 ${
                          avatarUrl ? 'hidden' : ''
                        }`}
                      >
                        {userInitials || <UserIcon className="h-5 w-5" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <TypeIcon className="h-4 w-4 shrink-0 text-brand-600" />
                          <p className="text-sm font-bold text-ink-900">
                            {v.user?.name ?? `User #${v.user_id}`}
                          </p>
                          <Badge tone={STATUS_BADGE[v.status] || 'neutral'} size="xs">
                            {v.status}
                          </Badge>
                          <Badge tone="neutral" size="xs">
                            {isCredential ? (v.type ? v.type.replace(/_/g, ' ') : 'Credential') : (v.type || 'Identity')}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-600">
                          {isCredential ? (
                            <>
                              <span className="font-semibold text-gray-900">{v.title}</span>
                              {v.issuing_organization && ` — ${v.issuing_organization}`}
                              {v.certificate_identifier && ` (ID: ${v.certificate_identifier})`}
                              {v.issue_date && ` · Issued ${formatDate(v.issue_date)}`}
                            </>
                          ) : (
                            <>
                              Identity Verification ({(v.type || 'Standard').replace(/_/g, ' ')}) · Submitted {formatDate(v.created_at ?? v.createdAt)}
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
                          <p className="mt-1 text-xs text-gray-500 font-medium">
                            Certificate Document: {v.file_original_name || 'Attached file'}
                          </p>
                        )}
                        {!isCredential && v.document_url && (
                          <a
                            href={getFullStorageUrl(v.document_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Identity Document
                          </a>
                        )}
                        {(v.rejection_reason || v.reason) && (
                          <p className="mt-1 text-xs text-danger-600">Reason: {v.rejection_reason || v.reason}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2 flex-wrap items-center sm:self-center">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenDetail(v)}
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview Details
                      </Button>

                      {isCredential && v.file_path && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleDownloadCredentialFile(v)}
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </Button>
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
                          {isCredential && (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => { setActionTarget(v); setActionType('resubmit'); }}
                            >
                              <RefreshCw className="h-3.5 w-3.5 text-amber-600" /> Request Resubmission
                            </Button>
                          )}
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

      {/* Full Merged Freelancer Profile & Verification Detail Preview Modal */}
      <Modal
        open={Boolean(detailTarget)}
        onClose={() => { setDetailTarget(null); setDetailFreelancerProfile(null); }}
        title="Freelancer Profile & Submission Details"
        size="xl"
      >
        {detailTarget && (
          <div className="space-y-6 text-ink-900">
            {/* 1. Freelancer Header Section with Photo */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="relative">
                {getFullStorageUrl(detailTarget.user?.avatar || detailFreelancerProfile?.profile?.user?.avatar) ? (
                  <img
                    src={getFullStorageUrl(detailTarget.user?.avatar || detailFreelancerProfile?.profile?.user?.avatar)}
                    alt={detailTarget.user?.name || 'Freelancer'}
                    className="h-16 w-16 rounded-full object-cover border-2 border-brand-500 shadow-sm"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                    {(detailTarget.user?.name || 'F').substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-ink-900">{detailTarget.user?.name || 'Unknown Freelancer'}</h3>
                  <Badge tone={STATUS_BADGE[detailTarget.status] || 'neutral'}>
                    {detailTarget.status}
                  </Badge>
                  <Badge tone="brand">
                    {detailTarget.item_type === 'credential' ? 'Credential / Certificate' : 'Identity Verification'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Email: <span className="font-semibold text-gray-700">{detailTarget.user?.email || 'N/A'}</span>
                  {(detailTarget.user?.phone || detailFreelancerProfile?.profile?.user?.phone) && (
                    ` · Phone: ${detailTarget.user?.phone || detailFreelancerProfile?.profile?.user?.phone}`
                  )}
                  {(detailTarget.user?.freelancer_profile?.location || detailFreelancerProfile?.profile?.location) && (
                    ` · Location: ${detailTarget.user?.freelancer_profile?.location || detailFreelancerProfile?.profile?.location}`
                  )}
                </p>
                {(detailTarget.user?.freelancer_profile?.headline || detailFreelancerProfile?.profile?.headline) && (
                  <p className="text-xs font-medium text-brand-700 mt-0.5">
                    {detailTarget.user?.freelancer_profile?.headline || detailFreelancerProfile?.profile?.headline}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleExportPDF(detailTarget.user_id)}
              >
                <Download className="h-3.5 w-3.5" /> Export PDF Profile
              </Button>
            </div>

            {/* 2. Key Profile Information Cards (Hourly Rate, Experience, Availability, Rating) */}
            {detailFreelancerProfile?.profile && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-brand-50/60 rounded-lg border border-brand-100 flex flex-col">
                  <span className="text-gray-500 flex items-center gap-1 font-medium"><DollarSign className="h-3.5 w-3.5 text-brand-600" /> Hourly Rate</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5">
                    {detailFreelancerProfile.profile.hourly_rate ? formatETB(detailFreelancerProfile.profile.hourly_rate) : 'Not set'}
                  </span>
                </div>
                <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-100 flex flex-col">
                  <span className="text-gray-500 flex items-center gap-1 font-medium"><Briefcase className="h-3.5 w-3.5 text-purple-600" /> Experience</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5 capitalize">
                    {detailFreelancerProfile.profile.experience_level || 'Not set'}
                  </span>
                </div>
                <div className="p-3 bg-green-50/60 rounded-lg border border-green-100 flex flex-col">
                  <span className="text-gray-500 flex items-center gap-1 font-medium"><Clock className="h-3.5 w-3.5 text-green-600" /> Availability</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5 capitalize">
                    {(detailFreelancerProfile.profile.availability_status || 'available').replace('_', ' ')}
                  </span>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100 flex flex-col">
                  <span className="text-gray-500 flex items-center gap-1 font-medium"><Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" /> Rating & Jobs</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5">
                    {detailFreelancerProfile.profile.rating ? `${detailFreelancerProfile.profile.rating} ★` : 'New'} ({detailFreelancerProfile.profile.completed_jobs_count || 0} jobs)
                  </span>
                </div>
              </div>
            )}

            {/* 3. Profile Overview / Bio */}
            {detailFreelancerProfile?.profile?.overview && (
              <div className="border rounded-xl p-4 bg-white space-y-1.5 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">About / Profile Overview</h4>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                  {detailFreelancerProfile.profile.overview}
                </p>
              </div>
            )}

            {/* 4. Skills & Expertise */}
            {detailFreelancerProfile?.profile?.skills?.length > 0 && (
              <div className="border rounded-xl p-4 bg-white space-y-2 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5 text-brand-600" /> Skills & Expertise ({detailFreelancerProfile.profile.skills.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {detailFreelancerProfile.profile.skills.map((skill) => (
                    <span key={skill.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                      {skill.name}
                      {skill.pivot?.years_of_experience != null && (
                        <span className="text-[10px] bg-brand-200 text-brand-900 rounded px-1 font-bold">
                          {skill.pivot.years_of_experience} yrs
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Submitted Item Information (Certificate or Identity) */}
            <div className="border rounded-xl p-4 bg-white space-y-3 shadow-xs">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                {detailTarget.item_type === 'credential' ? (
                  <><Award className="h-4 w-4 text-brand-600" /> Certificate Submission Details</>
                ) : (
                  <><FileText className="h-4 w-4 text-brand-600" /> Identity Verification Details</>
                )}
              </h4>

              {detailTarget.item_type === 'credential' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">Certificate Title:</span>
                    <p className="font-semibold text-gray-900">{detailTarget.title}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Category / Type:</span>
                    <p className="font-semibold text-gray-900">{(detailTarget.type || '').replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Issuing Organization:</span>
                    <p className="font-semibold text-gray-900">{detailTarget.issuing_organization || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Credential / Certificate ID:</span>
                    <p className="font-semibold text-gray-900">{detailTarget.certificate_identifier || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Issue Date:</span>
                    <p className="font-semibold text-gray-900">{detailTarget.issue_date ? formatDate(detailTarget.issue_date) : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Expiration Date:</span>
                    <p className="font-semibold text-gray-900">{detailTarget.expiration_date ? formatDate(detailTarget.expiration_date) : 'Does not expire'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Verification Source:</span>
                    <p className="font-semibold">
                      {detailTarget.verification_source === 'dream_more_lms' ? (
                        <span className="text-green-600">✓ Dream More LMS ({detailTarget.lms_course_name || 'Course Certificate'})</span>
                      ) : (
                        <span className="text-blue-600">External Certificate</span>
                      )}
                    </p>
                  </div>
                  {detailTarget.test_required && (
                    <div>
                      <span className="text-gray-400">Skill Test Result:</span>
                      <p className={`font-semibold ${detailTarget.test_status === 'passed' ? 'text-green-600' : 'text-amber-600'}`}>
                        {detailTarget.test_status === 'passed' ? 'Passed' : detailTarget.test_status === 'failed' ? 'Failed' : 'Pending'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">Document Type:</span>
                    <p className="font-semibold text-gray-900">{(detailTarget.type || 'Identity').replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Submission Date:</span>
                    <p className="font-semibold text-gray-900">{formatDate(detailTarget.created_at)}</p>
                  </div>
                  {detailTarget.notes && (
                    <div className="col-span-2">
                      <span className="text-gray-400">Applicant Notes:</span>
                      <p className="font-medium text-gray-700 bg-gray-50 p-2 rounded mt-1">{detailTarget.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Certificate / Identity File Attachment Box */}
              {(detailTarget.file_path || detailTarget.document_url) && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-brand-50/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-6 w-6 text-brand-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {detailTarget.file_original_name || 'Attached Document File'}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {detailTarget.item_type === 'credential' ? 'Certificate Verification File' : 'Identity Document File'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleDocumentPreview(detailTarget)}
                    >
                      <Eye className="h-3.5 w-3.5" /> View / Preview Document
                    </Button>
                    {detailTarget.item_type === 'credential' && detailTarget.file_path && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleDownloadCredentialFile(detailTarget)}
                      >
                        <Download className="h-3.5 w-3.5" /> Download File
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Combined Identity Verification Document (if attached with credential) */}
              {detailTarget.item_type === 'credential' && detailTarget.user?.verifications?.length > 0 && (() => {
                const identityDoc = detailTarget.user.verifications.find((verif) => verif.document_url || verif.notes);
                if (!identityDoc) return null;
                return (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-purple-50/60 p-3 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="h-6 w-6 text-purple-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-purple-950">
                          Attached Identity Verification Document
                        </p>
                        <p className="text-[11px] text-purple-700">
                          {identityDoc.notes ? `Notes: ${identityDoc.notes}` : 'Identity proof file submitted with this credential'}
                        </p>
                      </div>
                    </div>
                    {identityDoc.document_url && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleDocumentPreview(null, identityDoc.document_url)}
                      >
                        <Eye className="h-3.5 w-3.5 text-purple-600" /> View Identity Doc
                      </Button>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 6. Freelancer Identity Verification & Credentials Summary */}
            {detailLoading ? (
              <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
            ) : detailFreelancerProfile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Identity Verifications list */}
                <div className="border rounded-xl p-4 bg-white space-y-2">
                  <h5 className="font-bold text-gray-900 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" /> Identity Verifications ({detailFreelancerProfile.verifications?.length || 0})
                  </h5>
                  {detailFreelancerProfile.verifications?.length > 0 ? (
                    <div className="space-y-2">
                      {detailFreelancerProfile.verifications.map((iv) => (
                        <div key={iv.id} className="p-2 bg-gray-50 rounded border border-gray-100 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">{(iv.type || 'Identity').replace(/_/g, ' ')}</p>
                            <p className="text-[11px] text-gray-400">Submitted {formatDate(iv.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge tone={STATUS_BADGE[iv.status] || 'neutral'} size="xs">{iv.status}</Badge>
                            {iv.document_url && (
                              <a
                                href={getFullStorageUrl(iv.document_url)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-600 hover:underline text-[11px] font-semibold flex items-center gap-1"
                              >
                                <Eye className="h-3 w-3" /> View Doc
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">No identity documents submitted.</p>
                  )}
                </div>

                {/* All Freelancer Credentials */}
                <div className="border rounded-xl p-4 bg-white space-y-2">
                  <h5 className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-amber-600" /> Submitted Credentials ({detailFreelancerProfile.credentials?.length || 0})
                  </h5>
                  {detailFreelancerProfile.credentials?.length > 0 ? (
                    <div className="space-y-2">
                      {detailFreelancerProfile.credentials.map((c) => (
                        <div key={c.id} className="p-2 bg-gray-50 rounded border border-gray-100 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">{c.title}</p>
                            <p className="text-[11px] text-gray-400">{c.issuing_organization || 'External'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge tone={STATUS_BADGE[c.status] || 'neutral'} size="xs">{c.status}</Badge>
                            {c.file_path && (
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => handleDownloadCredentialFile({ ...c, item_type: 'credential' })}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">No credentials submitted.</p>
                  )}
                </div>
              </div>
            ) : null}

            {/* 7. Online Presence Links */}
            {detailFreelancerProfile?.profile && (detailFreelancerProfile.profile.github_url || detailFreelancerProfile.profile.linkedin_url || detailFreelancerProfile.profile.website) && (
              <div className="border rounded-xl p-4 bg-white space-y-2 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-gray-400">Online Presence</h4>
                <div className="flex flex-wrap gap-4">
                  {detailFreelancerProfile.profile.github_url && (
                    <a href={detailFreelancerProfile.profile.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gray-700 hover:text-brand-600 font-medium">
                      <ExternalLink className="h-4 w-4" /> GitHub
                    </a>
                  )}
                  {detailFreelancerProfile.profile.linkedin_url && (
                    <a href={detailFreelancerProfile.profile.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium">
                      <ExternalLink className="h-4 w-4" /> LinkedIn
                    </a>
                  )}
                  {detailFreelancerProfile.profile.website && (
                    <a href={detailFreelancerProfile.profile.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:underline font-medium">
                      <Globe className="h-4 w-4" /> Website
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* 8. Action Footer inside Modal */}
            {detailTarget.status === 'pending' && (
              <div className="pt-4 border-t border-gray-200 flex justify-end gap-2 flex-wrap">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => {
                    setActionTarget(detailTarget);
                    setActionType('approve');
                    setDetailTarget(null);
                  }}
                >
                  <CheckCircle className="h-4 w-4" /> Approve Submission
                </Button>
                {detailTarget.item_type === 'credential' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActionTarget(detailTarget);
                      setActionType('resubmit');
                      setDetailTarget(null);
                    }}
                  >
                    <RefreshCw className="h-4 w-4 text-amber-600" /> Request Resubmission
                  </Button>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setActionTarget(detailTarget);
                    setActionType('reject');
                    setDetailTarget(null);
                  }}
                >
                  <XCircle className="h-4 w-4" /> Reject Submission
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approve / Reject / Resubmit Action Modal */}
      <Modal
        open={Boolean(actionTarget && actionType)}
        onClose={() => { setActionTarget(null); setActionType(null); setRejectReason(''); }}
        title={actionType === 'approve' ? 'Approve Request' : actionType === 'resubmit' ? 'Request Resubmission' : 'Reject Request'}
        description={
          actionType === 'approve'
            ? `Approve the ${actionTarget?.item_type === 'credential' ? 'credential' : 'verification'} request for ${actionTarget?.user?.name ?? 'this user'}?`
            : actionType === 'resubmit'
            ? `Request resubmission of credential "${actionTarget?.title}" from ${actionTarget?.user?.name ?? 'this user'}.`
            : `Reject the ${actionTarget?.item_type === 'credential' ? 'credential' : 'verification'} request for ${actionTarget?.user?.name ?? 'this user'}.`
        }
        size="sm"
      >
        {(actionType === 'reject' || actionType === 'resubmit') && (
          <div className="mb-4">
            <Textarea
              label={actionType === 'resubmit' ? 'Resubmission Instructions / Reason *' : 'Rejection Reason (optional)'}
              placeholder={actionType === 'resubmit' ? 'Explain what needs correction before approval...' : 'Why is this being rejected?'}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              required={actionType === 'resubmit'}
            />
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => { setActionTarget(null); setActionType(null); setRejectReason(''); }}>
            Cancel
          </Button>
          <Button
            variant={actionType === 'approve' ? 'success' : actionType === 'resubmit' ? 'primary' : 'danger'}
            size="sm"
            loading={processing}
            disabled={actionType === 'resubmit' && !rejectReason.trim()}
            onClick={handleAction}
          >
            {actionType === 'approve' ? 'Approve' : actionType === 'resubmit' ? 'Submit Request' : 'Reject'}
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
        fileName={previewTarget?.file_original_name || previewTarget?.title || 'Document'}
        fileType={getMimeType(previewTarget?.file_original_name)}
        downloadUrl={previewUrl}
        loading={previewLoading}
        onDownload={previewTarget ? () => handleDownloadCredentialFile(previewTarget) : undefined}
      />
    </div>
  );
}
