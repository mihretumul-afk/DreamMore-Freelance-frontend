import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, MapPin, Star, DollarSign,
  Briefcase, Shield, Award, FolderOpen, ExternalLink, FileText,
  Globe, Link2, Image as ImageIcon, User, Mail, Phone, Calendar,
  AlertCircle, Eye, Download, ChevronDown, ChevronUp,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/marketplace/Avatar';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/errors';
import { formatETB, formatDate } from '../../utils/format';
import { generateFreelancerProfilePDF, previewFreelancerProfilePDF } from '../../utils/freelancerPdfExport';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { cn } from '../../utils/cn';

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: Detail Section
   ═══════════════════════════════════════════════════════════════════════════ */
function DetailSection({ icon: Icon, title, badge, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white px-6 py-4 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-ink-900">{title}</h3>
            {badge}
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && <CardBody className="px-6 py-5">{children}</CardBody>}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN: Admin Freelancer Detail Page
   ═══════════════════════════════════════════════════════════════════════════ */
export default function AdminFreelancerDetailPage() {
  usePageTitle('Freelancer Review — Admin');
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getFreelancerById(id);
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || 'Unable to load freelancer details.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load freelancer details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await adminService.approveFreelancer(id);
      showToast('Freelancer approved successfully!', 'success');
      navigate('/admin/freelancers');
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to approve freelancer.'), 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      await adminService.rejectFreelancer(id, rejectReason);
      showToast('Freelancer rejected.', 'success');
      navigate('/admin/freelancers');
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to reject freelancer.'), 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-64 animate-pulse rounded-card border border-gray-200 bg-white" />
        <div className="h-48 animate-pulse rounded-card border border-gray-200 bg-white" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState title="Unable to load freelancer" description={error} onRetry={loadData} />;
  }

  const { profile, verifications, credentials, portfolio, reviews, review_count } = data;
  const user = profile.user;
  const skills = profile.skills ?? [];
  const statusColors = { pending: 'warning', approved: 'success', rejected: 'danger' };
  const latestVerification = verifications?.[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      {/* ── Back + Actions Header ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate('/admin/freelancers')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-ink-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to approvals
        </button>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await previewFreelancerProfilePDF(data);
              } catch (err) {
                showToast('Unable to generate PDF preview. Please try the Download button instead.', 'error');
              }
            }}
          >
            <Eye className="h-4 w-4" /> Preview PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await generateFreelancerProfilePDF(data);
              } catch (err) {
                showToast('Unable to generate PDF. Please try again.', 'error');
              }
            }}
          >
            <Download className="h-4 w-4" /> Download PDF
          </Button>
          {profile.approval_status === 'pending' && (
            <>
              <Button variant="success" loading={processing} onClick={handleApprove}>
                <CheckCircle className="h-4 w-4" /> Approve
              </Button>
              <Button variant="danger" onClick={() => setShowRejectForm(!showRejectForm)}>
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Reject form ──────────────────────────────────────────────── */}
      {showRejectForm && (
        <Card className="border-danger-200 bg-danger-50">
          <CardBody className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-danger-600" />
              <p className="text-sm font-bold text-danger-800">Reject Application</p>
            </div>
            <input
              type="text"
              placeholder="Reason for rejection (optional)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-lg border border-danger-300 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder-gray-400 focus:border-danger-500 focus:outline-none focus:ring-2 focus:ring-danger-500/20"
            />
            <div className="flex gap-3">
              <Button variant="danger" loading={processing} onClick={handleReject}>
                Confirm Reject
              </Button>
              <Button variant="outline" onClick={() => { setShowRejectForm(false); setRejectReason(''); }}>
                Cancel
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Profile Header ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-violet-600 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-end">
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-white/30 shadow-xl">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/20 text-3xl font-extrabold text-white">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-2xl font-extrabold text-white">{user?.name || 'Unknown'}</h1>
              <Badge tone={statusColors[profile.approval_status]} size="sm">
                {profile.approval_status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-white/70">{profile.headline || 'No headline set'}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-white/60 sm:justify-start">
              <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {user?.email}</span>
              {profile.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.location}</span>}
              {profile.experience_level && <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {profile.experience_level}</span>}
              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> Joined {formatDate(profile.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Key Stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Hourly Rate', value: profile.hourly_rate ? formatETB(profile.hourly_rate) : 'Not set', icon: DollarSign, color: 'emerald' },
          { label: 'Experience', value: profile.experience_level || 'Not set', icon: Briefcase, color: 'blue' },
          { label: 'Availability', value: profile.availability_status || 'available', icon: Clock, color: 'amber' },
          { label: 'Skills', value: skills.length, icon: Award, color: 'violet' },
        ].map(({ label, value, icon: StatIcon, color }) => (
          <div key={label} className={cn(
            'rounded-xl border p-4',
            color === 'emerald' && 'border-emerald-200 bg-emerald-50',
            color === 'blue' && 'border-blue-200 bg-blue-50',
            color === 'amber' && 'border-amber-200 bg-amber-50',
            color === 'violet' && 'border-violet-200 bg-violet-50',
          )}>
            <div className="flex items-center gap-2 mb-2">
              <StatIcon className={cn('h-4 w-4', `text-${color}-600`)} />
              <span className="text-xs font-semibold text-gray-600 uppercase">{label}</span>
            </div>
            <p className="text-lg font-bold text-ink-900 capitalize">{value}</p>
          </div>
        ))}
      </div>

      {/* ── About ────────────────────────────────────────────────────── */}
      <DetailSection icon={User} title="About / Overview">
        <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
          {profile.overview || 'No overview provided.'}
        </p>
      </DetailSection>

      {/* ── Contact Info ─────────────────────────────────────────────── */}
      <DetailSection icon={Mail} title="Contact Information">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <User className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Full Name</p>
              <p className="text-sm font-medium text-ink-900">{user?.name || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <Mail className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-ink-900">{user?.email || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <Phone className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium text-ink-900">{user?.phone || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <MapPin className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="text-sm font-medium text-ink-900">{profile.location || 'Not provided'}</p>
            </div>
          </div>
        </dl>
      </DetailSection>

      {/* ── Skills ───────────────────────────────────────────────────── */}
      <DetailSection
        icon={Award}
        title="Skills & Expertise"
        badge={skills.length > 0 ? <Badge tone="info" size="xs">{skills.length} skills</Badge> : null}
      >
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <div key={skill.id} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <span className="text-sm font-semibold text-ink-900">{skill.name}</span>
                {skill.pivot?.years_of_experience != null && (
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                    {skill.pivot.years_of_experience}y exp
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No skills added yet.</p>
        )}
      </DetailSection>

      {/* ── Links ────────────────────────────────────────────────────── */}
      <DetailSection icon={Link2} title="Online Presence">
        <div className="flex flex-wrap gap-3">
          {profile.github_url && (
            <a href={profile.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 hover:border-brand-200 hover:text-brand-600 transition-colors">
              <Globe className="h-4 w-4" /> GitHub <ExternalLink className="h-3 w-3 text-gray-400" />
            </a>
          )}
          {profile.linkedin_url && (
            <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 hover:border-brand-200 hover:text-brand-600 transition-colors">
              <Globe className="h-4 w-4" /> LinkedIn <ExternalLink className="h-3 w-3 text-gray-400" />
            </a>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 hover:border-brand-200 hover:text-brand-600 transition-colors">
              <Globe className="h-4 w-4" /> Website <ExternalLink className="h-3 w-3 text-gray-400" />
            </a>
          )}
          {!profile.github_url && !profile.linkedin_url && !profile.website && (
            <p className="text-sm text-gray-500">No links provided.</p>
          )}
        </div>
      </DetailSection>

      {/* ── Verification Documents ───────────────────────────────────── */}
      <DetailSection
        icon={Shield}
        title="Verification Documents"
        badge={verifications?.length > 0 ? <Badge tone={latestVerification?.status === 'approved' ? 'success' : latestVerification?.status === 'rejected' ? 'danger' : 'warning'} size="xs">{latestVerification?.status}</Badge> : <Badge tone="neutral" size="xs">None</Badge>}
      >
        {verifications?.length > 0 ? (
          <div className="space-y-3">
            {verifications.map((v) => (
              <div key={v.id} className="flex items-center gap-4 rounded-xl border border-gray-200 p-4">
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  v.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                  v.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                )}>
                  {v.status === 'approved' ? <CheckCircle className="h-5 w-5" /> :
                   v.status === 'rejected' ? <XCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink-900">{v.type?.replace(/_/g, ' ')}</p>
                    <Badge tone={v.status === 'approved' ? 'success' : v.status === 'rejected' ? 'danger' : 'warning'} size="xs">
                      {v.status}
                    </Badge>
                  </div>
                  {v.notes && <p className="mt-0.5 text-xs text-gray-500">Notes: {v.notes}</p>}
                  {v.reason && <p className="mt-0.5 text-xs text-red-600">Reason: {v.reason}</p>}
                  <p className="mt-0.5 text-[11px] text-gray-400">Submitted {formatDate(v.created_at)}</p>
                </div>
                {v.document_url && (
                  <a
                    href={v.document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Document
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No verification documents submitted.</p>
        )}
      </DetailSection>

      {/* ── Credentials ──────────────────────────────────────────────── */}
      <DetailSection
        icon={FileText}
        title="Credentials & Certificates"
        badge={credentials?.length > 0 ? <Badge tone="info" size="xs">{credentials.length}</Badge> : null}
      >
        {credentials?.length > 0 ? (
          <div className="space-y-3">
            {credentials.map((cred) => (
              <div key={cred.id} className="flex items-center gap-4 rounded-xl border border-gray-200 p-4">
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  cred.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                  cred.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                )}>
                  <Award className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{cred.title}</p>
                  <p className="text-xs text-gray-500">
                    {cred.type} {cred.issuing_organization && `— ${cred.issuing_organization}`}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge tone={cred.status === 'approved' ? 'success' : cred.status === 'rejected' ? 'danger' : 'warning'} size="xs">
                      {cred.status}
                    </Badge>
                    {cred.issue_date && <span className="text-[11px] text-gray-400">Issued {formatDate(cred.issue_date)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No credentials submitted.</p>
        )}
      </DetailSection>

      {/* ── Portfolio ────────────────────────────────────────────────── */}
      <DetailSection
        icon={FolderOpen}
        title="Portfolio & Projects"
        badge={portfolio?.length > 0 ? <Badge tone="info" size="xs">{portfolio.length}</Badge> : null}
      >
        {portfolio?.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {portfolio.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                {item.image_url ? (
                  <div className="h-40 w-full overflow-hidden bg-gray-100">
                    <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-gray-50">
                    <ImageIcon className="h-10 w-10 text-gray-300" />
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-semibold text-ink-900">{item.title}</h4>
                  {item.description && (
                    <p className="mt-1 text-xs text-gray-600 line-clamp-3">{item.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {item.category && (
                      <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-brand-700">
                        {item.category.name}
                      </span>
                    )}
                    {item.skill && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                        {item.skill.name}
                      </span>
                    )}
                    {item.project_url && (
                      <a href={item.project_url} target="_blank" rel="noreferrer" className="text-[11px] font-medium text-brand-600 hover:text-brand-700">
                        View Live →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No portfolio items added.</p>
        )}
      </DetailSection>

      {/* ── Reviews ──────────────────────────────────────────────────── */}
      <DetailSection
        icon={Star}
        title="Reviews"
        badge={review_count > 0 ? <Badge tone="info" size="xs">{review_count} review{review_count !== 1 ? 's' : ''}</Badge> : null}
      >
        {reviews?.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={review.reviewer?.name} src={review.reviewer?.avatar} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{review.reviewer?.name || 'Anonymous'}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn('h-3 w-3', s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300')} />
                      ))}
                      <span className="ml-1 text-[11px] text-gray-400">{formatDate(review.created_at)}</span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-gray-600">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No reviews yet.</p>
        )}
      </DetailSection>

      {/* ── Rejection Info ───────────────────────────────────────────── */}
      {profile.rejection_reason && (
        <Card className="border-danger-200 bg-danger-50">
          <CardBody>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-danger-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-danger-800">Rejection Reason</p>
                <p className="mt-1 text-sm text-danger-700">{profile.rejection_reason}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Bottom Actions ───────────────────────────────────────────── */}
      {profile.approval_status === 'pending' && (
        <Card>
          <CardBody>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Review all information above before making a decision.
              </p>
              <div className="flex items-center gap-3">
                <Button variant="success" loading={processing} onClick={handleApprove} size="lg">
                  <CheckCircle className="h-4 w-4" /> Approve Freelancer
                </Button>
                <Button variant="danger" onClick={() => setShowRejectForm(true)} size="lg">
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
