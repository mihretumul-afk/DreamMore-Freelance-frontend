import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Building2, CheckCircle2, Send, ShieldCheck,
  Sparkles, ExternalLink, Lock, FileText, Clock, MapPin, Briefcase,
} from 'lucide-react';
import Container from '../../components/common/Container';
import ErrorState from '../../components/common/ErrorState';
import Card, { CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import SkillBadge from '../../components/marketplace/SkillBadge';
import ProposalForm from '../../components/proposals/ProposalForm';
import { jobService } from '../../services/jobService';
import { proposalService } from '../../services/proposalService';
import { normalizeJob } from '../../utils/jobMapper';
import { normalizeProposal, proposalFormToPayload } from '../../utils/proposalMapper';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { formatDate, formatETB } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';

/* ─── Breadcrumbs ──────────────────────────────────────────────────────── */
function Breadcrumbs({ job }) {
  return (
    <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
      <Link to="/freelancer/jobs" className="hover:text-brand-600 transition-colors">Find Jobs</Link>
      <span>/</span>
      <Link to={`/jobs/${job.id}`} className="hover:text-brand-600 transition-colors truncate max-w-[200px]">{job.title}</Link>
      <span>/</span>
      <span className="text-ink-900 font-medium">Submit Proposal</span>
    </nav>
  );
}

/* ─── Job Summary Sidebar ──────────────────────────────────────────────── */
function JobSummarySidebar({ job }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4 lg:sticky lg:top-24">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <FileText className="h-4 w-4 text-brand-500" />
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Job Details</span>
      </div>

      <div>
        <h3 className="text-sm font-bold text-ink-900 leading-snug">{job.title}</h3>
        {job.employer?.name && (
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> {job.employer.name}
          </p>
        )}
      </div>

      {/* Key Info */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Budget</span>
          <span className="font-bold text-emerald-700">{formatETB(job.budget || job.minBudget)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Type</span>
          <Badge tone="info" size="xs">{job.jobType || job.budgetType || 'Fixed'}</Badge>
        </div>
        {job.experienceLevel && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Experience</span>
            <span className="font-medium text-ink-700 capitalize">{job.experienceLevel}</span>
          </div>
        )}
        {job.location && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Location</span>
            <span className="font-medium text-ink-700 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {job.location}
            </span>
          </div>
        )}
        {job.postedAt && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Posted</span>
            <span className="text-ink-700 flex items-center gap-1">
              <Clock className="h-3 w-3" /> {job.postedAt}
            </span>
          </div>
        )}
      </div>

      {/* Skills */}
      {job.skills?.length > 0 && (
        <div className="pt-3 border-t border-gray-100 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Required Skills</span>
          <div className="flex flex-wrap gap-1.5">
            {job.skills.map((skill) => (
              <SkillBadge key={skill.id} size="xs">{skill.name}</SkillBadge>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tips for a Strong Proposal</span>
        <ul className="space-y-1.5">
          {[
            'Be specific about your approach',
            'Include relevant past work',
            'Set realistic timelines',
            'Price competitively',
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-[11px] text-gray-500">
              <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <Button as={Link} to={`/jobs/${job.id}`} variant="outline" size="sm" className="w-full">
        <ExternalLink className="h-3.5 w-3.5" /> View Full Job
      </Button>
    </div>
  );
}

/* ─── Success View ─────────────────────────────────────────────────────── */
function SuccessView({ job, proposal }) {
  return (
    <div className="mx-auto max-w-2xl text-center space-y-6 mt-8">
      {/* Success Icon */}
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-green-100">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-ink-900">Proposal Submitted!</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Your proposal for <strong className="text-ink-900">"{job.title}"</strong> has been sent to the employer for review.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
          <p className="text-[10px] font-bold uppercase text-gray-400">Bid Amount</p>
          <p className="text-sm font-extrabold text-ink-900 mt-1">{formatETB(proposal.bidAmount)}</p>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
          <p className="text-[10px] font-bold uppercase text-gray-400">Duration</p>
          <p className="text-sm font-bold text-ink-900 mt-1">{proposal.estimatedDuration}</p>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
          <p className="text-[10px] font-bold uppercase text-gray-400">Status</p>
          <Badge tone="warning" size="xs" className="mt-1">Pending</Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Button as={Link} to="/freelancer/proposals" size="lg">
          <FileText className="h-4 w-4" /> View My Proposals
        </Button>
        <Button as={Link} to="/freelancer/jobs" variant="outline" size="lg">
          Browse More Jobs
        </Button>
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────── */
export default function FreelancerSubmitProposalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [existingProposal, setExistingProposal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [submittedProposal, setSubmittedProposal] = useState(null);

  usePageTitle(job ? `Apply: ${job.title}` : 'Submit Proposal');

  // Refresh auth user on mount so approval status is current
  const { refreshUser } = useAuth();
  useEffect(() => {
    refreshUser().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const jobRes = await jobService.getJob(id);
      if (jobRes.success) {
        const normJob = normalizeJob(jobRes.data);
        setJob(normJob);
        const propRes = await proposalService.getMyProposals({ page: 1 });
        const items = Array.isArray(propRes.data) ? propRes.data : (propRes.data?.data ?? []);
        const found = items.find((p) => p.job_id === normJob.id);
        if (found) setExistingProposal(normalizeProposal(found));
      } else {
        setError(jobRes.message || 'Job not found.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load job details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (formValues) => {
    setFieldErrors({});
    setGeneralError(null);
    setSubmitting(true);
    try {
      const payload = proposalFormToPayload(formValues);
      const res = await proposalService.submitProposal(job.id, payload);
      const normalized = normalizeProposal(res.data?.proposal ?? res.data);
      setSubmittedProposal(normalized);
      addToast('Proposal submitted successfully!', 'success');
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      const errorMsg = getErrorMessage(err, 'Failed to submit proposal.');
      setGeneralError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading ────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <Container className="py-8 lg:py-12">
        <div className="space-y-4 animate-pulse">
          <div className="h-4 w-48 rounded bg-gray-200" />
          <div className="h-10 w-64 rounded-xl bg-gray-200" />
          <div className="grid gap-8 lg:grid-cols-[1fr_320px] mt-6">
            <div className="h-96 rounded-2xl bg-gray-100" />
            <div className="h-64 rounded-2xl bg-gray-100" />
          </div>
        </div>
      </Container>
    );
  }

  if (error || !job) {
    return (
      <Container className="py-8 lg:py-12">
        <ErrorState title="Job not found" description={error} onRetry={loadData} />
      </Container>
    );
  }

  const hasActiveProposal = existingProposal && ['pending', 'shortlisted', 'accepted'].includes(existingProposal.status);

  return (
    <Container className="py-8 lg:py-12 max-w-6xl">
      {/* Back link */}
      <Link to={`/jobs/${job.id}`} className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-600 transition-colors mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to job
      </Link>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink-900">Submit a Proposal</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review the job details and submit your proposal to the employer.
        </p>
      </div>

      {/* Success View */}
      {submittedProposal ? (
        <SuccessView job={job} proposal={submittedProposal} />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
          {/* Main Column */}
          <div className="space-y-6">
            {hasActiveProposal ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                    <Lock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-amber-900">Already Applied</h3>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Your proposal is currently <strong>{existingProposal.status.toUpperCase()}</strong>.
                      You can review or withdraw it from your proposals page.
                    </p>
                    <Button as={Link} to={`/freelancer/proposals/${existingProposal.id}`} size="sm" variant="outline">
                      <ExternalLink className="h-3.5 w-3.5" /> View Proposal
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <ProposalForm
                job={job}
                submitting={submitting}
                fieldErrors={fieldErrors}
                generalError={generalError}
                onSubmit={handleSubmit}
                onCancel={() => navigate(`/jobs/${job.id}`)}
              />
            )}
          </div>

          {/* Sidebar */}
          <JobSummarySidebar job={job} />
        </div>
      )}
    </Container>
  );
}
