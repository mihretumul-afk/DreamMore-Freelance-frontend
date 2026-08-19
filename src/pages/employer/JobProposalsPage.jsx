import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Clock, Inbox, Star, XCircle } from 'lucide-react';
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
import { jobService } from '../../services/jobService';
import { proposalService } from '../../services/proposalService';
import { normalizeJob } from '../../utils/jobMapper';
import { normalizeProposal } from '../../utils/proposalMapper';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';

const ACTION_DIALOGS = {
  shortlist: {
    title: 'Shortlist proposal?',
    description:
      'Shortlisting flags this proposal as a top candidate. The freelancer is not notified yet — this just updates the status.',
    confirmLabel: 'Shortlist',
    tone: 'primary',
  },
  reject: {
    title: 'Reject proposal?',
    description: 'This proposal will be marked as rejected.',
    confirmLabel: 'Reject Proposal',
    tone: 'danger',
  },
  accept: {
    title: 'Accept proposal?',
    description:
      'Accepting creates a contract, rejects the remaining active proposals, and moves the job to in progress. This happens on the server.',
    confirmLabel: 'Accept & Create Contract',
    tone: 'success',
  },
};

export default function EmployerJobProposalsPage() {
  usePageTitle('Job Proposals');
  const { id: jobId } = useParams();

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
        setProposals((proposalsRes.data?.data ?? []).map(normalizeProposal));
        setMeta(proposalsRes.data?.meta ?? null);
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
      setNotice(res.message || 'Proposal updated.');
      setActionTarget(null);
      // Refresh real data — never pretend the status changed locally.
      await fetchAll(true);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to update this proposal. Please try again.'));
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
              description="Real proposals from the API — status changes are applied by the server."
            />
            <CardBody className="p-2 sm:p-3">
              <ul className="divide-y divide-gray-100">
                {proposals.map((proposal) => (
                  <li key={proposal.id} className="px-3 py-4 sm:px-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <Avatar name={proposal.freelancer?.name} src={proposal.freelancer?.avatar} size="md" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-ink-900">
                              {proposal.freelancer?.name ?? `Freelancer #${proposal.freelancerId}`}
                            </p>
                            <StatusBadge status={proposal.status} size="xs" />
                          </div>
                          <p className="mt-0.5 text-sm font-semibold text-brand-600">
                            {formatETB(proposal.bidAmount)}
                            {proposal.currency && proposal.currency !== 'ETB'
                              ? ` ${proposal.currency}`
                              : ''}
                            <span className="font-normal text-gray-400">
                              {' '}
                              · {proposal.estimatedDuration || 'No duration'}
                            </span>
                          </p>
                          {proposal.coverLetter && (
                            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500">
                              {proposal.coverLetter}
                            </p>
                          )}
                          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-400">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            Submitted {formatDate(proposal.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
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
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Accept
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
