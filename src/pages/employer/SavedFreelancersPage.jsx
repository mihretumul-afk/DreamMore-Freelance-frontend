import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bookmark, Users, X } from 'lucide-react';
import Container from '../../components/common/Container';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/marketplace/PageHeader';
import Pagination from '../../components/marketplace/Pagination';
import { savedService } from '../../services/savedService';
import { getErrorMessage } from '../../utils/errors';
import { usePageTitle } from '../../hooks/usePageTitle';
import FreelancerCard from '../../components/marketplace/FreelancerCard';

export default function SavedFreelancersPage() {
  usePageTitle('Saved Freelancers');
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [freelancers, setFreelancers] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await savedService.getSavedFreelancers({ page });
      if (response.success) {
        setFreelancers(response.data ?? []);
        setMeta(response.meta ?? null);
      } else {
        setError(response.message || 'Unable to load saved freelancers.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load saved freelancers. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const handleRemove = useCallback(async (freelancerProfileId) => {
    setRemovingId(freelancerProfileId);
    try {
      await savedService.unsaveFreelancer(freelancerProfileId);
      setFreelancers((prev) => (prev ?? []).filter((s) => s.freelancer_profile_id !== freelancerProfileId));
      loadSaved();
    } catch {
      loadSaved();
    } finally {
      setRemovingId(null);
    }
  }, [loadSaved]);

  const goToPage = (nextPage) => setSearchParams({ page: nextPage });

  const totalPages = meta?.last_page ?? 1;

  return (
    <Container className="py-8 lg:py-12">
      <PageHeader
        eyebrow="Saved"
        title="Saved Freelancers"
        description="Freelancers you have saved. Review their profiles and reach out when you're ready to hire."
        breadcrumbs={[{ label: 'Dashboard', to: '/employer/dashboard' }, { label: 'Saved Freelancers' }]}
      />

      {loading && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="animate-pulse rounded-card border border-gray-200 bg-white p-5 shadow-card">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-48 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <ErrorState title="Unable to load saved freelancers" description={error} onRetry={loadSaved} />
      )}

      {!loading && !error && freelancers?.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="No saved freelancers yet."
          description="Save freelancers you're interested in and they'll appear here."
          action={
            <Link
              to="/freelancers"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              <Users className="h-4 w-4" aria-hidden="true" /> Find Talent
            </Link>
          }
        />
      )}

      {!loading && !error && freelancers?.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {freelancers.map((saved) => (
              <div key={saved.id} className="relative">
                <FreelancerCard
                  freelancer={{
                    ...saved.freelancer,
                    name: saved.freelancer.user?.name,
                    hourlyRate: saved.freelancer.hourly_rate,
                    skills: saved.freelancer.skills,
                    availability: saved.freelancer.availability_status,
                    completion: undefined,
                  }}
                  className={removingId === saved.freelancer_profile_id ? 'opacity-50' : ''}
                />
                <button
                  type="button"
                  onClick={() => handleRemove(saved.freelancer_profile_id)}
                  disabled={removingId === saved.freelancer_profile_id}
                  aria-label={`Remove ${saved.freelancer.user?.name ?? 'freelancer'} from saved list`}
                  className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500 disabled:opacity-50"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
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
