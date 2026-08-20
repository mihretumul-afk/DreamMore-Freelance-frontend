import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bookmark, Briefcase } from 'lucide-react';
import Container from '../../components/common/Container';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/marketplace/PageHeader';
import JobCard from '../../components/marketplace/JobCard';
import JobCardSkeleton from '../../components/jobs/JobCardSkeleton';
import Pagination from '../../components/marketplace/Pagination';
import { savedService } from '../../services/savedService';
import { getErrorMessage } from '../../utils/errors';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function SavedJobsPage() {
  usePageTitle('Saved Jobs');
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [jobs, setJobs] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const loadSavedJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await savedService.getSavedJobs({ page });
      if (response.success) {
        setJobs(response.data ?? []);
        setMeta(response.meta ?? null);
      } else {
        setError(response.message || 'Unable to load saved jobs.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load saved jobs. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadSavedJobs();
  }, [loadSavedJobs]);

  const handleUnsave = useCallback(async (jobId) => {
    setSavingId(jobId);
    try {
      await savedService.unsaveJob(jobId);
      setJobs((prev) => (prev ?? []).filter((s) => s.job_id !== jobId));
      // Reload to get correct pagination.
      loadSavedJobs();
    } catch {
      loadSavedJobs();
    } finally {
      setSavingId(null);
    }
  }, [loadSavedJobs]);

  const goToPage = (nextPage) => setSearchParams({ page: nextPage });

  const totalPages = meta?.last_page ?? 1;

  return (
    <Container className="py-8 lg:py-12">
      <PageHeader
        eyebrow="Saved"
        title="Saved Jobs"
        description="Jobs you have saved for later. Come back anytime to review or apply."
        breadcrumbs={[{ label: 'Dashboard', to: '/freelancer/dashboard' }, { label: 'Saved Jobs' }]}
      />

      {loading && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <ErrorState title="Unable to load saved jobs" description={error} onRetry={loadSavedJobs} />
      )}

      {!loading && !error && jobs?.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="No saved jobs yet."
          description="Save jobs you're interested in and they'll appear here."
          action={
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              <Briefcase className="h-4 w-4" aria-hidden="true" /> Browse Jobs
            </Link>
          }
        />
      )}

      {!loading && !error && jobs?.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {jobs.map((saved) => (
              <JobCard
                key={saved.id}
                job={{ ...saved.job, saved: true }}
                savable
                onSave={() => {}}
                onUnsave={handleUnsave}
                saving={savingId === saved.job_id}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={goToPage}
            className="mt-8"
          />
        </>
      )}
    </Container>
  );
}
