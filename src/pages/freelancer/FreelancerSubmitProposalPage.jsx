import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Lock,
} from 'lucide-react';
import Container from '../../components/common/Container';
import ErrorState from '../../components/common/ErrorState';
import PageHeader from '../../components/marketplace/PageHeader';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/marketplace/StatusBadge';
import SkillBadge from '../../components/marketplace/SkillBadge';
import ProposalForm from '../../components/proposals/ProposalForm';
import { jobService } from '../../services/jobService';
import { proposalService } from '../../services/proposalService';
import { normalizeJob } from '../../utils/jobMapper';
import { normalizeProposal, proposalFormToPayload } from '../../utils/proposalMapper';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { formatDate, formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function FreelancerSubmitProposalPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [existingProposal, setExistingProposal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [submittedProposal, setSubmittedProposal] = useState(null);

  usePageTitle(job ? `Apply: ${job.title}` : 'Submit Proposal');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Load job details
      const jobRes = await jobService.getJob(id);
      if (jobRes.success) {
        const normJob = normalizeJob(jobRes.data);
        setJob(normJob);

        // 2. Check if user already submitted a proposal for this job
        const propRes = await proposalService.getMyProposals({ page: 1 });
        const items = Array.isArray(propRes.data) ? propRes.data : (propRes.data?.data ?? []);
        const found = items.find((p) => p.job_id === normJob.id);
        if (found) {
          setExistingProposal(normalizeProposal(found));
        }
      } else {
        setError(jobRes.message || 'Job not found.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load job details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (formValues) => {
    setFieldErrors({});
    setGeneralError(null);
    setSubmitting(true);
    try {
      const payload = proposalFormToPayload(formValues);
      const res = await proposalService.submitProposal(job.id, payload);
      const normalized = normalizeProposal(res.data?.proposal ?? res.data);
      setSubmittedProposal(normalized);
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setGeneralError(getErrorMessage(err, 'Failed to submit proposal. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-8 lg:py-12">
        <div className="h-64 animate-pulse rounded-3xl bg-gray-200" />
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

  // Active existing proposal blocking new submission
  const hasActiveProposal = existingProposal && ['pending', 'shortlisted', 'accepted'].includes(existingProposal.status);

  return (
    <Container className="py-8 lg:py-12">
      <PageHeader
        eyebrow="Freelancer Application"
        title="Submit a Proposal"
        breadcrumbs={[
          { label: 'Find Jobs', to: '/freelancer/jobs' },
          { label: job.title, to: `/jobs/${job.id}` },
          { label: 'Submit Proposal' },
        ]}
      />

      {/* Success View */}
      {submittedProposal ? (
        <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-xl space-y-6 mt-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-ink-900">Proposal Submitted Successfully!</h2>
            <p className="text-sm text-gray-600">
              Your proposal for <strong>"{job.title}"</strong> is now pending review by the employer.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs text-slate-700 flex justify-around">
            <div>
              <span className="text-gray-400 block font-medium">Proposed Bid</span>
              <span className="font-extrabold text-ink-900 text-sm">{formatETB(submittedProposal.bidAmount)}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Estimated Duration</span>
              <span className="font-extrabold text-ink-900 text-sm">{submittedProposal.estimatedDuration}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Status</span>
              <StatusBadge status={submittedProposal.status} size="xs" />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center pt-2">
            <Button as={Link} to="/freelancer/proposals" size="lg">
              View My Proposals
            </Button>
            <Button as={Link} to="/freelancer/jobs" variant="outline" size="lg">
              Browse More Jobs
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          {/* Main Column — Proposal Form */}
          <div className="space-y-6">
            {hasActiveProposal ? (
              <Card className="rounded-3xl border-amber-200 bg-amber-50/50 p-6">
                <div className="flex items-start gap-4">
                  <Lock className="h-6 w-6 text-amber-600 shrink-0 mt-1" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-amber-900">You already submitted a proposal for this job</h3>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Your proposal is currently <strong>{existingProposal.status.toUpperCase()}</strong>. You can review its status or withdraw it on your proposals page.
                    </p>
                    <div className="pt-2">
                      <Button as={Link} to={`/freelancer/proposals/${existingProposal.id}`} size="sm">
                        <ExternalLink className="h-4 w-4" /> View Submitted Proposal
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
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

          {/* Persistent Job Summary Context Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            <Card className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
                  Job Summary
                </span>
                <StatusBadge status={job.status} size="xs" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-ink-900">{job.title}</h3>
                {job.employer?.name && (
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                    {job.employer.name}
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Job Budget</span>
                  <span className="font-extrabold text-emerald-700 text-sm">{formatETB(job.budget || job.minBudget)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Budget Type</span>
                  <span className="font-semibold text-ink-900 capitalize">{job.jobType || job.budgetType || 'fixed'}</span>
                </div>
                {job.experienceLevel && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Experience</span>
                    <span className="font-semibold text-ink-900 capitalize">{job.experienceLevel}</span>
                  </div>
                )}
              </div>

              {/* Skills */}
              {job.skills?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Required Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map((skill) => (
                      <SkillBadge key={skill.id} size="xs">{skill.name}</SkillBadge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button as={Link} to={`/jobs/${job.id}`} target="_blank" variant="outline" size="sm" className="w-full">
                  <ExternalLink className="h-4 w-4" /> View Full Job Details
                </Button>
              </div>
            </Card>
          </aside>
        </div>
      )}
    </Container>
  );
}
