import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ChevronRight, Clock, Send } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/marketplace/PageHeader';
import StatusBadge from '../../components/marketplace/StatusBadge';
import Pagination from '../../components/marketplace/Pagination';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProposalSkeleton from '../../components/proposals/ProposalSkeleton';
import { proposalService } from '../../services/proposalService';
import { normalizeProposal } from '../../utils/proposalMapper';
import { getErrorMessage } from '../../utils/errors';
import { formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function FreelancerProposalsPage() {
  usePageTitle('My Proposals');

  const [page, setPage] = useState(1);
  const [proposals, setProposals] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await proposalService.getMyProposals({ page });
      setProposals((res.data?.data ?? []).map(normalizeProposal));
      setMeta(res.data?.meta ?? null);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load your proposals. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const total = meta?.total ?? proposals.length;

  if (loading) return <ProposalSkeleton />;

  if (error) {
    return <ErrorState title="Unable to load your proposals" description={error} onRetry={loadProposals} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Freelancer"
        title="My Proposals"
        description={`${total} proposal${total === 1 ? '' : 's'} submitted across jobs.`}
      />

      {proposals.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={Send}
              title="You haven't submitted any proposals yet"
              description="When you apply to jobs, your proposals and their statuses will appear here."
              action={
                <Button as={Link} to="/jobs">
                  <Briefcase className="h-4 w-4" aria-hidden="true" /> Find Jobs
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader title="Submitted proposals" description="Real statuses from the API — no placeholders." />
            <CardBody className="p-2 sm:p-3">
              <ul className="divide-y divide-gray-100">
                {proposals.map((proposal) => (
                  <li key={proposal.id}>
                    <Link
                      to={`/freelancer/proposals/${proposal.id}`}
                      className="group flex items-center justify-between gap-4 rounded-xl px-3 py-4 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 sm:px-4"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-ink-900 transition-colors group-hover:text-brand-600">
                            {proposal.jobTitle ?? `Proposal #${proposal.id}`}
                          </p>
                          <StatusBadge status={proposal.status} size="xs" />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span>
                            {formatETB(proposal.bidAmount)}
                            {proposal.currency && proposal.currency !== 'ETB'
                              ? ` ${proposal.currency}`
                              : ''}
                          </span>
                          {proposal.estimatedDuration && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                              {proposal.estimatedDuration}
                            </span>
                          )}
                          {proposal.createdAtLabel && <span>{proposal.createdAtLabel}</span>}
                        </div>
                      </div>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-brand-500"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Pagination page={page} totalPages={meta?.last_page ?? 1} onChange={setPage} />
        </>
      )}
    </div>
  );
}
