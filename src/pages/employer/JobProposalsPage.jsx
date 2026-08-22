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
import RatingDisplay from '../../components/marketplace/RatingDisplay';
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
                  <li key={proposal.id} className="px-3 py-5 sm:px-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 items-start gap-3.5">
                        <Avatar name={proposal.freelancer?.name} src={proposal.freelancer?.avatar} size="lg" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              to={`/freelancers/${proposal.freelancerId}`}
                              className="text-base font-bold text-ink-900 hover:text-brand-600 transition"
                            >
                              {proposal.freelancer?.name ?? `Freelancer #${proposal.freelancerId}`}
                            </Link>
                            {proposal.freelancer?.verificationStatus === 'approved' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-semibold text-success-700">
                                <ShieldCheck className="h-3 w-3" /> Verified
                              </span>
                            )}
                            <StatusBadge status={proposal.status} size="xs" />
                          </div>

                          {proposal.freelancer?.headline && (
                            <p className="mt-0.5 text-xs text-gray-600 font-medium">
                              {proposal.freelancer.headline}
                            </p>
                          )}

                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                            <RatingDisplay rating={proposal.freelancer?.rating ?? 0} count={proposal.freelancer?.reviewCount ?? 0} size="xs" />
                            <span>·</span>
                            <p className="font-semibold text-brand-600">
                              Bid: {formatETB(proposal.bidAmount)}
                              {proposal.currency && proposal.currency !== 'ETB' ? ` ${proposal.currency}` : ''}
                            </p>
                            <span>·</span>
                            <span>{proposal.estimatedDuration || 'No duration'}</span>
                          </div>

                          {/* Skills badges */}
                          {proposal.freelancer?.skills && proposal.freelancer.skills.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {proposal.freelancer.skills.map((s) => (
                                <span
                                  key={s.id || s.name}
                                  className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700"
                                >
                                  {s.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Cover letter */}
                          {proposal.coverLetter && (
                            <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-700">
                              <p className="font-semibold text-ink-900 mb-1">Cover Letter / Pitch:</p>
                              <p className="whitespace-pre-line">{proposal.coverLetter}</p>
                            </div>
                          )}

                          {/* Attached portfolio items */}
                          {proposal.portfolioItems && proposal.portfolioItems.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="flex items-center gap-1.5 text-xs font-bold text-ink-900">
                                <Briefcase className="h-3.5 w-3.5 text-brand-600" />
                                Attached Portfolio Projects ({proposal.portfolioItems.length}):
                              </p>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {proposal.portfolioItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white p-2.5 text-xs shadow-2xs"
                                  >
                                    {item.imageUrl ? (
                                      <img src={item.imageUrl} alt={item.title} className="h-10 w-10 shrink-0 rounded object-cover" />
                                    ) : (
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-100 text-gray-400">
                                        <Briefcase className="h-4 w-4" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold text-ink-900 truncate">{item.title}</p>
                                      {item.description && (
                                        <p className="text-[11px] text-gray-500 truncate">{item.description}</p>
                                      )}
                                    </div>
                                    {item.projectUrl && (
                                      <a
                                        href={item.projectUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1 text-brand-600 hover:bg-brand-50 rounded"
                                        title="View project link"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <p className="mt-2.5 flex items-center gap-1 text-[11px] text-gray-400">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            Submitted {formatDate(proposal.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-end">
                        {proposal.status === 'pending' && (
                          <Button size="xs" variant="outline" onClick={() => openAction(proposal, 'shortlist')}>
                            <Star className="h-3.5 w-3.5" aria-hidden="true" /> Shortlist
                          </Button>
                        )}
                        {(proposal.status === 'pending' || proposal.status === 'shortlisted') && (
                          <>
                            <Button size="xs" variant="danger" onClick={() => openAction(proposal, 'reject')}>
                              <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Reject
                            </Button>
                            <Button size="xs" variant="success" onClick={() => openAction(proposal, 'accept')}>
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Accept Proposal
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
