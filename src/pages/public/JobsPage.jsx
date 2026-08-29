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
import HorizontalFilterBar from '../../components/marketplace/HorizontalFilterBar';
import Modal from '../../components/ui/Modal';
import JobFiltersPanel from '../../components/jobs/JobFiltersPanel';
import JobCardSkeleton from '../../components/jobs/JobCardSkeleton';
import { jobService } from '../../services/jobService';
import { savedService } from '../../services/savedService';
import { categoryService } from '../../services/categoryService';
import { skillService } from '../../services/skillService';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
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

export default function JobsPage() {
  const { t } = useI18n();
  usePageTitle(t('jobs.title'));
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs, setJobs] = useState(null);
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  const { user } = useAuth();

  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const [locationInput, setLocationInput] = useState(searchParams.get('location') ?? '');

  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  // Keep text drafts in sync when the URL changes externally.
  useEffect(() => {
    setSearchInput(searchParams.get('search') ?? '');
    setLocationInput(searchParams.get('location') ?? '');
  }, [searchParams]);

  // Load categories & skills for filter dropdowns
  useEffect(() => {
    categoryService.getCategories()
      .then((res) => setCategories(res?.data ?? (Array.isArray(res) ? res : [])))
      .catch(() => {});

    skillService.getSkills()
      .then((res) => {
        const list = res?.data ?? (Array.isArray(res) ? res : []);
        setSkills(list.filter((s) => s.is_active !== false));
      })
      .catch(() => {});
  }, []);

  // Load saved state for authenticated users.
  const loadSavedState = useCallback(async () => {
    if (!user) return;
    try {
      const res = await savedService.getSavedJobs({ page: 1 });
      if (res.success) {
        setSavedIds(new Set((res.data ?? []).map((s) => s.job_id)));
      }
    } catch {
      // Silently ignore
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
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (searchInput.trim()) next.set('search', searchInput.trim());
      else next.delete('search');
      if (locationInput.trim()) next.set('location', locationInput.trim());
      else next.delete('location');
      next.delete('page');
      return next;
    });
    setFiltersOpen(false);
  };

  const clearAll = () => {
    setSearchInput('');
    setLocationInput('');
    setSearchParams({});
  };
  const goToPage = (nextPage) => updateParams({ page: nextPage }, { resetPage: false });

  const activeFilters = [...searchParams.entries()]
    .filter(([key]) => key !== 'page')
    .map(([key, value]) => {
      if (key === 'category_id') {
        const cat = categories.find((c) => String(c.id) === String(value));
        return { key, value, label: `Category: ${cat?.name ?? value}` };
      }
      return { key, value, label: `${FILTER_LABELS[key] ?? key}: ${value}` };
    });

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

      {/* Guru.com Style Top Horizontal Search & Filter Bar */}
      <div className="mb-6">
        <HorizontalFilterBar
          type="jobs"
          values={{
            search: searchInput,
            category_id: searchParams.get('category_id') ?? '',
            skill_id: searchParams.get('skill_id') ?? '',
            location: locationInput,
            budget_type: searchParams.get('budget_type') ?? '',
            experience_level: searchParams.get('experience_level') ?? '',
            location_type: searchParams.get('location_type') ?? '',
            sort: searchParams.get('sort') ?? '',
          }}
          categories={categories}
          skills={skills}
          onChange={(key, value) => {
            if (key === 'search') setSearchInput(value);
            else if (key === 'location') setLocationInput(value);
            else updateParams({ [key]: value });
          }}
          onApply={applyTextFilters}
          onClear={clearAll}
        />
      </div>

      {/* Results Header Toolbar (Total count & active filter pills) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-gray-600" aria-live="polite">
            {showSkeletons
              ? t('jobs.loading')
              : total != null
                ? t('jobs.foundCount', { count: total })
                : ''}
          </p>
        </div>

        {/* Mobile filter toggle */}
        <FilterButton
          active={activeFilters.length > 0}
          icon={SlidersHorizontal}
          label={t('common.filter')}
          onClick={() => setFiltersOpen(true)}
          className="md:hidden"
        />
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50/50 py-1 pl-3 pr-1.5 text-xs font-medium text-brand-900 shadow-2xs"
            >
              <span className="max-w-48 truncate">{filter.label}</span>
              <button
                type="button"
                onClick={() => updateParams({ [filter.key]: '' })}
                aria-label={`Remove ${filter.label} filter`}
                className="rounded-full p-0.5 text-brand-500 transition-colors hover:bg-brand-100 hover:text-brand-900"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            {t('common.clearFilters')}
          </button>
        </div>
      )}

      {/* Results Grid - Spans Full Width */}
      {showSkeletons && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={goToPage}
            className="mt-8"
          />
        </>
      )}

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
            budget_type: searchParams.get('budget_type') ?? '',
            experience_level: searchParams.get('experience_level') ?? '',
            location_type: searchParams.get('location_type') ?? '',
            sort: searchParams.get('sort') ?? '',
          }}
          onChange={(key, value) => {
            if (key === 'search') setSearchInput(value);
            else if (key === 'location') setLocationInput(value);
            else updateParams({ [key]: value });
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
