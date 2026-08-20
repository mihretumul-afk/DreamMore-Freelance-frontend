import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX, X } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/marketplace/PageHeader';
import JobCard from '../../components/marketplace/JobCard';
import Pagination from '../../components/marketplace/Pagination';
import FilterButton from '../../components/marketplace/FilterButton';
import SearchBar from '../../components/marketplace/SearchBar';
import Modal from '../../components/ui/Modal';
import JobFiltersPanel from '../../components/jobs/JobFiltersPanel';
import JobCardSkeleton from '../../components/jobs/JobCardSkeleton';
import { jobService } from '../../services/jobService';
import { savedService } from '../../services/savedService';
import { useAuth } from '../../hooks/useAuth';
import { normalizeJob } from '../../utils/jobMapper';
import { getErrorMessage } from '../../utils/errors';
import { usePageTitle } from '../../hooks/usePageTitle';

const FILTER_LABELS = {
  search: 'Search',
  category_id: 'Category',
  skill_id: 'Skill',
  location: 'Location',
  budget_type: 'Budget type',
  experience_level: 'Experience',
  location_type: 'Work mode',
  min_budget: 'Min budget',
  max_budget: 'Max budget',
  sort: 'Sort',
};

export default function FreelancerJobsPage() {
  usePageTitle('Find Jobs');
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs, setJobs] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  const { user } = useAuth();

  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');

  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  useEffect(() => {
    setSearchInput(searchParams.get('search') ?? '');
  }, [searchParams]);

  // Load saved state
  const loadSavedState = useCallback(async () => {
    if (!user) return;
    try {
      const res = await savedService.getSavedJobs({ page: 1 });
      if (res.success) {
        setSavedIds(new Set((res.data ?? []).map((s) => s.job_id)));
      }
    } catch {
      // non-critical
    }
  }, [user]);

  useEffect(() => {
    loadSavedState();
  }, [loadSavedState]);

  const handleSaveJob = useCallback(async (jobId) => {
    if (!user) return;
    setSavingId(jobId);
    try {
      await savedService.saveJob(jobId);
      setSavedIds((prev) => new Set(prev).add(jobId));
    } catch {
      loadSavedState();
    } finally {
      setSavingId(null);
    }
  }, [user, loadSavedState]);

  const handleUnsaveJob = useCallback(async (jobId) => {
    if (!user) return;
    setSavingId(jobId);
    try {
      await savedService.unsaveJob(jobId);
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    } catch {
      loadSavedState();
    } finally {
      setSavingId(null);
    }
  }, [user, loadSavedState]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobService.getJobs({
        search: searchParams.get('search') ?? undefined,
        category_id: searchParams.get('category_id') ?? undefined,
        skill_id: searchParams.get('skill_id') ?? undefined,
        location: searchParams.get('location') ?? undefined,
        budget_type: searchParams.get('budget_type') ?? undefined,
        experience_level: searchParams.get('experience_level') ?? undefined,
        location_type: searchParams.get('location_type') ?? undefined,
        min_budget: searchParams.get('min_budget') ?? undefined,
        max_budget: searchParams.get('max_budget') ?? undefined,
        sort: searchParams.get('sort') ?? undefined,
        page,
      });
      if (response.success) {
        setJobs((response.data ?? []).map(normalizeJob));
        setMeta(response.meta ?? null);
      } else {
        setError(response.message || 'Unable to load jobs.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load jobs right now.'));
    } finally {
      setLoading(false);
    }
  }, [searchParams, page]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const updateParams = useCallback(
    (updates, { resetPage = true } = {}) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        });
        if (resetPage) next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  const clearAll = () => setSearchParams({});
  const goToPage = (nextPage) => updateParams({ page: nextPage }, { resetPage: false });

  const activeFilters = [...searchParams.entries()]
    .filter(([key]) => key !== 'page')
    .map(([key, value]) => ({
      key,
      value,
      label: `${FILTER_LABELS[key] ?? key}: ${value}`,
    }));

  const total = meta?.total;
  const totalPages = meta?.last_page ?? 1;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Freelancer"
        title="Find Jobs"
        description="Browse open opportunities and submit proposals."
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-auto sm:min-w-72 sm:max-w-md">
          <SearchBar
            value={searchInput}
            onChange={(value) => {
              setSearchInput(value);
              if (value === '') updateParams({ search: '' });
            }}
            onSubmit={() => updateParams({ search: searchInput.trim() })}
            placeholder="Search jobs by title, skill, or keyword"
            label="Search jobs"
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500" aria-live="polite">
            {loading
              ? 'Loading jobs…'
              : total != null
                ? `${total} job${total === 1 ? '' : 's'} found`
                : ''}
          </p>
          <FilterButton
            active={activeFilters.length > 0}
            label="Filters"
            onClick={() => setFiltersOpen(true)}
            className="sm:hidden"
          />
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white py-1 pl-3 pr-1.5 text-xs font-medium text-ink-700 shadow-sm"
            >
              <span className="max-w-48 truncate">{filter.label}</span>
              <button
                type="button"
                onClick={() => updateParams({ [filter.key]: '' })}
                aria-label={`Remove ${filter.label} filter`}
                className="rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-ink-900"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <ErrorState title="Unable to load jobs" description={error} onRetry={loadJobs} />
      )}

      {/* Empty */}
      {!loading && !error && jobs?.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="No jobs found"
          description="Try adjusting your search or filters."
          action={
            <button
              type="button"
              onClick={clearAll}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Clear filters
            </button>
          }
        />
      )}

      {/* Results */}
      {!loading && !error && jobs?.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={{ ...job, saved: savedIds.has(job.id) }}
                savable
                onSave={handleSaveJob}
                onUnsave={handleUnsaveJob}
                saving={savingId === job.id}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={goToPage} className="mt-8" />
        </>
      )}

      {/* Mobile filter modal */}
      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        description="Refine the jobs you see."
      >
        <JobFiltersPanel
          values={Object.fromEntries(searchParams)}
          onChange={(key, value) => updateParams({ [key]: value })}
          onApply={() => setFiltersOpen(false)}
          onClear={() => {
            clearAll();
            setFiltersOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
