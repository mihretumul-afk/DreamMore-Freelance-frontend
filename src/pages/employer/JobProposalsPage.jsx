import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, Inbox, Star, XCircle, ShieldCheck, Briefcase, ExternalLink } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/marketplace/PageHeader';
import Avatar from '../../components/marketplace/Avatar';
import StatusBadge from '../../components/marketplace/StatusBadge';
import Pagination from '../../components/marketplace/Pagination';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProposalSkeleton from '../../components/proposals/ProposalSkeleton';
import ConfirmActionModal from '../../components/proposals/ConfirmActionModal';
import ProposalPortfolioGallery from '../../components/proposals/ProposalPortfolioGallery';
import { MapPin, DollarSign, Award, Code, Globe, User } from 'lucide-react';
import { jobService } from '../../services/jobService';
import { proposalService } from '../../services/proposalService';
import { normalizeJob } from '../../utils/jobMapper';
import { normalizeProposal } from '../../utils/proposalMapper';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';

const ACTION_DIALOGS = {
  shortlist: {
    title: 'Shortlist proposal?',
    description:
      'Shortlisting flags this proposal as a top candidate and notifies the freelancer.',
    confirmLabel: 'Shortlist',
    tone: 'primary',
  },
  reject: {
    title: 'Reject proposal?',
    description: 'This proposal will be marked as rejected and the freelancer will be notified.',
    confirmLabel: 'Reject Proposal',
    tone: 'danger',
  },
  accept: {
    title: 'Accept proposal?',
    description:
      'Accepting creates a contract, rejects remaining proposals, and moves the job to in-progress.',
    confirmLabel: 'Accept & Create Contract',
    tone: 'success',
  },
};

export default function EmployerJobProposalsPage() {
  usePageTitle('Job Proposals');
  const { id: jobId } = useParams();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [job, setJob] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [actionTarget, setActionTarget] = useState(null); // { proposal, kind }
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);

  const fetchAll = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const [jobRes, proposalsRes] = await Promise.all([
          jobService.getJob(jobId),
          proposalService.getJobProposals(jobId, { page }),
        ]);
        setJob(normalizeJob(jobRes.data));
        const rawProposals = Array.isArray(proposalsRes.data)
          ? proposalsRes.data
          : (proposalsRes.data?.data ?? []);
        setProposals(rawProposals.map(normalizeProposal));
        setMeta(proposalsRes.meta ?? proposalsRes.data?.meta ?? null);
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load proposals. Please try again.'));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [jobId, page],
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const performAction = async () => {
    if (!actionTarget) return;
    const { proposal, kind } = actionTarget;
    setActing(true);
    setActionError(null);
    try {
      const call =
        kind === 'shortlist'
          ? proposalService.shortlistProposal
          : kind === 'reject'
            ? proposalService.rejectProposal
            : proposalService.acceptProposal;
      const res = await call(jobId, proposal.id);
      const msg = res.message || 'Proposal updated.';
      setNotice(msg);
      showToast(msg, 'success');
      setActionTarget(null);
      await fetchAll(true);
    } catch (err) {
      const msg = getErrorMessage(err, 'Unable to update this proposal. Please try again.');
      setActionError(msg);
      showToast(msg, 'error');
      setActing(false);
    }
  };

  const openAction = (proposal, kind) => {
    setActionError(null);
    setActionTarget({ proposal, kind });
  };

  if (loading) return <ProposalSkeleton />;

  if (error || !job) {
    return (
      <ErrorState title="Unable to load proposals" description={error} onRetry={() => fetchAll()} />
    );
  }

  const total = meta?.total ?? proposals.length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employer"
        title="Job Proposals"
        description={`${total} proposal${total === 1 ? '' : 's'} for “${job.title}”.`}
        breadcrumbs={[
          { label: 'My Jobs', to: '/employer/jobs' },
          { label: job.title, to: `/employer/jobs/${job.id}` },
          { label: 'Proposals' },
        ]}
      />

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm font-medium text-success-700"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {notice}
        </div>
      )}

      {proposals.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={Inbox}
              title="No proposals for this job yet"
              description="When freelancers apply, their proposals will appear here for you to shortlist, reject, or accept."
            />
          </CardBody>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader
              title="Proposals"
              description="Review freelancer bids, attached portfolio work, credentials, and experience."
            />
            <CardBody className="p-2 sm:p-3">
              <ul className="divide-y divide-gray-100">
                {proposals.map((proposal) => (
                  <li key={proposal.id} className="px-3 py-6 sm:px-5">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <Avatar name={proposal.freelancer?.name} src={proposal.freelancer?.avatar} size="xl" className="ring-2 ring-brand-100 shadow-sm" />
                        <div className="min-w-0 flex-1 space-y-3">
                          {/* Freelancer Header & Badges */}
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                to={`/freelancers/${proposal.freelancerId}`}
                                className="text-lg font-black text-slate-900 hover:text-brand-600 transition"
                              >
                                {proposal.freelancer?.name ?? `Freelancer #${proposal.freelancerId}`}
                              </Link>
                              {proposal.freelancer?.verificationStatus === 'approved' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                                  <ShieldCheck className="h-3.5 w-3.5" /> Verified Expert
                                </span>
                              )}
                              <StatusBadge status={proposal.status} size="xs" />
                            </div>

                            {proposal.freelancer?.headline && (
                              <p className="mt-0.5 text-sm font-semibold text-brand-700">
                                {proposal.freelancer.headline}
                              </p>
                            )}

                            {/* Key Stats Bar */}
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                              <span className="font-extrabold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                                Proposed Bid: {formatETB(proposal.bidAmount)}
                                {proposal.currency && proposal.currency !== 'ETB' ? ` ${proposal.currency}` : ''}
                              </span>
                              <span>·</span>
                              <span>Duration: {proposal.estimatedDuration || 'Not specified'}</span>
                              {proposal.freelancer?.hourlyRate && (
                                <>
                                  <span>·</span>
                                  <span className="flex items-center gap-0.5">
                                    Rate: {formatETB(proposal.freelancer.hourlyRate)}/hr
                                  </span>
                                </>
                              )}
                              {proposal.freelancer?.location && (
                                <>
                                  <span>·</span>
                                  <span className="flex items-center gap-0.5 text-slate-500">
                                    <MapPin className="h-3.5 w-3.5" /> {proposal.freelancer.location}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Overview / Bio Spotlight */}
                          {proposal.freelancer?.overview && (
                            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs text-slate-700 leading-relaxed">
                              <p className="font-bold text-slate-900 mb-1 flex items-center gap-1">
                                <User className="h-3.5 w-3.5 text-brand-600" /> Freelancer Overview:
                              </p>
                              <p className="line-clamp-3 leading-relaxed">{proposal.freelancer.overview}</p>
                            </div>
                          )}

                          {/* Skills badges */}
                          {proposal.freelancer?.skills && proposal.freelancer.skills.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Core Expertise:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {proposal.freelancer.skills.map((s) => (
                                  <span
                                    key={s.id || s.name}
                                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200/60"
                                  >
                                    {typeof s === 'string' ? s : s.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Freelancer External Links */}
                          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                            <Link
                              to={`/freelancers/${proposal.freelancerId}`}
                              className="inline-flex items-center gap-1 font-bold text-brand-600 hover:text-brand-700 underline"
                            >
                              <User className="h-3.5 w-3.5" /> View Full Profile & Credentials →
                            </Link>
                            {proposal.freelancer?.githubUrl && (
                              <a
                                href={proposal.freelancer.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
                              >
                                <Code className="h-3.5 w-3.5" /> GitHub
                              </a>
                            )}
                            {proposal.freelancer?.linkedinUrl && (
                              <a
                                href={proposal.freelancer.linkedinUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                              >
                                <Briefcase className="h-3.5 w-3.5" /> LinkedIn
                              </a>
                            )}
                            {proposal.freelancer?.website && (
                              <a
                                href={proposal.freelancer.website}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
                              >
                                <Globe className="h-3.5 w-3.5" /> Website
                              </a>
                            )}
                          </div>

                          {/* Cover letter / Pitch */}
                          {proposal.coverLetter && (
                            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4 text-xs leading-relaxed text-slate-800">
                              <p className="font-bold text-brand-900 text-sm mb-1.5 flex items-center gap-1.5">
                                Proposal Cover Letter & Pitch:
                              </p>
                              <p className="whitespace-pre-line leading-relaxed text-slate-700">{proposal.coverLetter}</p>
                            </div>
                          )}

                          {/* Advanced Attached Portfolio Projects Gallery */}
                          {proposal.portfolioItems && proposal.portfolioItems.length > 0 && (
                            <div className="pt-2">
                              <ProposalPortfolioGallery items={proposal.portfolioItems} />
                            </div>
                          )}

                          <p className="pt-1 flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            Submitted {formatDate(proposal.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Employer Action Controls */}
                      <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-end">
                        {proposal.status === 'pending' && (
                          <Button size="xs" variant="outline" onClick={() => openAction(proposal, 'shortlist')}>
                            <Star className="h-3.5 w-3.5" aria-hidden="true" /> Shortlist Candidate
                          </Button>
                        )}
                        {(proposal.status === 'pending' || proposal.status === 'shortlisted') && (
                          <>
                            <Button size="xs" variant="danger" onClick={() => openAction(proposal, 'reject')}>
                              <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Reject Proposal
                            </Button>
                            <Button size="xs" variant="success" onClick={() => openAction(proposal, 'accept')}>
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Accept & Hire
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Pagination page={page} totalPages={meta?.last_page ?? 1} onChange={setPage} />
        </>
      )}

      <ConfirmActionModal
        open={Boolean(actionTarget)}
        onClose={() => setActionTarget(null)}
        title={actionTarget ? ACTION_DIALOGS[actionTarget.kind].title : ''}
        description={actionTarget ? ACTION_DIALOGS[actionTarget.kind].description : ''}
        confirmLabel={actionTarget ? ACTION_DIALOGS[actionTarget.kind].confirmLabel : ''}
        tone={actionTarget ? ACTION_DIALOGS[actionTarget.kind].tone : 'primary'}
        busy={acting}
        error={actionError}
        onConfirm={performAction}
      />
    </div>
  );
}
