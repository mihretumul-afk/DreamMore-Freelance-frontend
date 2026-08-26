import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, SearchX, X } from 'lucide-react';
import Container from '../../components/common/Container';
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
import { useI18n } from '../../i18n';
import { normalizeJob } from '../../utils/jobMapper';
import { getErrorMessage } from '../../utils/errors';
import { usePageTitle } from '../../hooks/usePageTitle';  const FILTER_LABELS = {
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

export default function JobsPage() {
  const { t } = useI18n();
  usePageTitle(t('jobs.title'));
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs, setJobs] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  const { user } = useAuth();

  // Text filter drafts — the URL stays the source of truth; these are applied
  // on submit/apply so typing does not rewrite the URL on every keystroke.
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const [locationInput, setLocationInput] = useState(searchParams.get('location') ?? '');
  const [minBudget, setMinBudget] = useState(searchParams.get('min_budget') ?? '');
  const [maxBudget, setMaxBudget] = useState(searchParams.get('max_budget') ?? '');

  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  // Keep text drafts in sync when the URL changes externally.
  useEffect(() => {
    setSearchInput(searchParams.get('search') ?? '');
    setLocationInput(searchParams.get('location') ?? '');
    setMinBudget(searchParams.get('min_budget') ?? '');
    setMaxBudget(searchParams.get('max_budget') ?? '');
  }, [searchParams]);

  // Load saved state for authenticated users.
  const loadSavedState = useCallback(async () => {
    if (!user) return;
    try {
      const res = await savedService.getSavedJobs({ page: 1 });
      if (res.success) {
        setSavedIds(new Set((res.data ?? []).map((s) => s.job_id)));
      }
    } catch {
      // Silently ignore — save state is non-critical.
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
        budget_type: searchParams.get('budget_type') ?? undefined,
        experience_level: searchParams.get('experience_level') ?? undefined,
        location_type: searchParams.get('location_type') ?? undefined,
        location: searchParams.get('location') ?? undefined,
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
      setError(getErrorMessage(err, 'Unable to load jobs right now. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [searchParams, page]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  /** Write params into the URL; reset to page 1 for filter changes. */
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

  const applyTextFilters = () => {
    // Commit ALL current filter values atomically — text drafts + already-set
    // dropdown values — so the Apply button always reflects the complete state.
    setSearchParams((prev) => {
      const next = new URLSearchParams();
      // Carry over dropdown/select values already committed to the URL.
      const selectKeys = [
        'category_id', 'skill_id', 'budget_type',
        'experience_level', 'location_type', 'sort',
      ];
      selectKeys.forEach((key) => {
        const v = prev.get(key);
        if (v) next.set(key, v);
      });
      // Flush text input drafts.
      if (searchInput.trim()) next.set('search', searchInput.trim());
      if (locationInput.trim()) next.set('location', locationInput.trim());
      if (minBudget) next.set('min_budget', minBudget);
      if (maxBudget) next.set('max_budget', maxBudget);
      // Always reset to page 1.
      next.delete('page');
      return next;
    });
    setFiltersOpen(false);
  };

  const clearAll = () => setSearchParams({});
  const goToPage = (nextPage) => updateParams({ page: nextPage }, { resetPage: false });

  const activeFilters = [...searchParams.entries()]
    .filter(([key]) => key !== 'page')
    .map(([key, value]) => ({ key, value, label: `${FILTER_LABELS[key] ?? key}: ${value}` }));

  const total = meta?.total;
  const totalPages = meta?.last_page ?? 1;
  const showSkeletons = loading;
  const showError = !loading && error;
  const showEmpty = !loading && !error && jobs?.length === 0;

  return (
    <Container className="py-8 lg:py-12">
      <PageHeader
        eyebrow={t('jobs.eyebrow')}
        title={t('jobs.title')}
        description={t('jobs.description')}
        breadcrumbs={[{ label: t('nav.homeShort'), to: '/' }, { label: t('jobs.title') }]}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Desktop filter sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block" aria-label="Job filters">
          <JobFiltersPanel
            values={{
              search: searchInput,
              category_id: searchParams.get('category_id') ?? '',
              skill_id: searchParams.get('skill_id') ?? '',
              location: locationInput,
              min_budget: minBudget,
              max_budget: maxBudget,
              budget_type: searchParams.get('budget_type') ?? '',
              experience_level: searchParams.get('experience_level') ?? '',
              location_type: searchParams.get('location_type') ?? '',
              sort: searchParams.get('sort') ?? '',
            }}
            onChange={(key, value) => {
              if (['search', 'location', 'min_budget', 'max_budget'].includes(key)) {
                if (key === 'search') setSearchInput(value);
                if (key === 'location') setLocationInput(value);
                if (key === 'min_budget') setMinBudget(value);
                if (key === 'max_budget') setMaxBudget(value);
              } else {
                updateParams({ [key]: value });
              }
            }}
            onApply={applyTextFilters}
            onClear={clearAll}
          />
        </aside>

        {/* Results column */}
        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="w-full sm:w-auto sm:min-w-72 sm:max-w-md">
              <SearchBar
                value={searchInput}
                onChange={(value) => {
                  setSearchInput(value);
                  if (value === '') updateParams({ search: '' });
                }}
                onSubmit={applyTextFilters}
                placeholder={t('hero.searchPlaceholder')}
                label={t('common.search')}
              />
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-500" aria-live="polite">
                {showSkeletons
                  ? t('jobs.loading')
                  : total != null
                    ? t('jobs.foundCount', { count: total })
                    : ''}
              </p>
              <FilterButton
                active={activeFilters.length > 0}
                icon={SlidersHorizontal}
                label={t('common.filter')}
                onClick={() => setFiltersOpen(true)}
                className="lg:hidden"
              />
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
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
                {t('common.clearFilters')}
              </button>
            </div>
          )}

          {/* Results */}
          {showSkeletons && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-2">
              {Array.from({ length: 6 }, (_, index) => (
                <JobCardSkeleton key={index} />
              ))}
            </div>
          )}

          {showError && (
            <ErrorState
              title={t('common.errorOccurred')}
              description={error}
              onRetry={loadJobs}
            />
          )}

          {showEmpty && (
            <EmptyState
              icon={SearchX}
              title={t('common.noResults')}
              description={t('jobs.noJobs')}
              action={
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
                >
                  {t('common.clearFilters')}
                </button>
              }
            />
          )}

          {!showSkeletons && !showError && jobs?.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={goToPage}
                className="mt-8"
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile filter modal */}
      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t('common.filter')}
        description={t('categories.description')}
      >
        <JobFiltersPanel
          values={{
            search: searchInput,
            category_id: searchParams.get('category_id') ?? '',
            skill_id: searchParams.get('skill_id') ?? '',
            location: locationInput,
            min_budget: minBudget,
            max_budget: maxBudget,
            budget_type: searchParams.get('budget_type') ?? '',
            experience_level: searchParams.get('experience_level') ?? '',
            location_type: searchParams.get('location_type') ?? '',
            sort: searchParams.get('sort') ?? '',
          }}
          onChange={(key, value) => {
            if (['search', 'location', 'min_budget', 'max_budget'].includes(key)) {
              if (key === 'search') setSearchInput(value);
              if (key === 'location') setLocationInput(value);
              if (key === 'min_budget') setMinBudget(value);
              if (key === 'max_budget') setMaxBudget(value);
            } else {
              updateParams({ [key]: value });
            }
          }}
          onApply={applyTextFilters}
          onClear={() => {
            clearAll();
            setFiltersOpen(false);
          }}
        />
      </Modal>
    </Container>
  );
}
