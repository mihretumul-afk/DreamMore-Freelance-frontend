import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Users, SearchX, X, Star, MapPin, Bookmark } from 'lucide-react';
import Container from '../../components/common/Container';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/marketplace/PageHeader';
import Avatar from '../../components/marketplace/Avatar';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Pagination from '../../components/marketplace/Pagination';
import FilterButton from '../../components/marketplace/FilterButton';
import HorizontalFilterBar from '../../components/marketplace/HorizontalFilterBar';
import Modal from '../../components/ui/Modal';
import { freelancerService } from '../../services/freelancerService';
import { savedService } from '../../services/savedService';
import { categoryService } from '../../services/categoryService';
import { skillService } from '../../services/skillService';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
import { getErrorMessage } from '../../utils/errors';
import { formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { cn } from '../../utils/cn';

const FILTER_LABELS = {
  search: 'Search',
  category_id: 'Category',
  skill_id: 'Skill',
  experience_level: 'Experience',
  availability_status: 'Availability',
  location: 'Location',
  min_hourly_rate: 'Min rate',
  max_hourly_rate: 'Max rate',
  sort: 'Sort by',
};

function FreelancerCard({ freelancer, savedIds, onToggleSave, savingId }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const isSaved = savedIds.has(String(freelancer.id));
  const isSaving = String(savingId) === String(freelancer.id);

  const handleToggleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    onToggleSave?.(freelancer.id, isSaved);
  };

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden transition-shadow hover:shadow-lg">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <Avatar
            name={freelancer.user?.name ?? 'F'}
            src={freelancer.user?.avatar}
            size="md"
            variant="brand"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold text-ink-900">
                {freelancer.user?.name ?? 'Freelancer'}
              </h3>
              {freelancer.rating > 0 && (
                <span className="inline-flex items-center gap-0.5 text-sm text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  {Number(freelancer.rating).toFixed(1)}
                </span>
              )}
            </div>
            {freelancer.headline && (
              <p className="mt-0.5 truncate text-sm text-gray-500">{freelancer.headline}</p>
            )}
            {freelancer.location && (
              <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {freelancer.location}
              </p>
            )}
            {freelancer.categoryName && (
              <span className="mt-1.5 inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">
                {freelancer.categoryName}
              </span>
            )}
          </div>
          <div className="text-right">
            {freelancer.hourly_rate > 0 && (
              <p className="text-sm font-semibold text-ink-900">
                {formatETB(freelancer.hourly_rate)}
                <span className="font-normal text-gray-400">/hr</span>
              </p>
            )}
            {freelancer.experience_level && (
              <Badge
                tone={freelancer.experience_level === 'expert' ? 'success' : 'neutral'}
                className="mt-1"
              >
                {freelancer.experience_level}
              </Badge>
            )}
          </div>
        </div>

        {/* Skills */}
        {freelancer.skills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {freelancer.skills.slice(0, 5).map((skill) => (
              <span
                key={skill.id}
                className="inline-block rounded-full bg-ink-50 px-2.5 py-0.5 text-xs font-medium text-ink-700"
              >
                {skill.name}
              </span>
            ))}
            {freelancer.skills.length > 5 && (
              <span className="inline-block rounded-full bg-ink-50 px-2.5 py-0.5 text-xs text-ink-500">
                +{freelancer.skills.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-5">
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {freelancer.completed_jobs_count > 0 && (
              <span>
                {freelancer.completed_jobs_count} {t('freelancers.completedJobs')}
              </span>
            )}
            {freelancer.availability_status && (
              <span
                className={cn(
                  'font-medium',
                  freelancer.availability_status === 'available'
                    ? 'text-green-600'
                    : freelancer.availability_status === 'busy'
                      ? 'text-amber-600'
                      : 'text-gray-400',
                )}
              >
                {t(`status.${freelancer.availability_status}`) !== `status.${freelancer.availability_status}`
                  ? t(`status.${freelancer.availability_status}`)
                  : freelancer.availability_status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleSave}
              disabled={isSaving}
              aria-pressed={isSaved}
              aria-label={isSaved ? t('freelancers.removeFromSaved') : t('freelancers.saveTalent')}
              className={cn(
                'font-semibold transition-all',
                isSaved
                  ? 'border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold'
                  : 'border-gray-200 text-gray-700 hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-600',
              )}
            >
              <Bookmark
                className={cn('h-3.5 w-3.5 mr-1', isSaved ? 'fill-brand-600 text-brand-600' : 'text-gray-400')}
                aria-hidden="true"
              />
              {isSaved ? 'Saved' : 'Save'}
            </Button>
            <Button as={Link} to={`/freelancers/${freelancer.id}`} variant="outline" size="sm">
              {t('common.viewDetails')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function FreelancersPage() {
  const { t } = useI18n();
  usePageTitle(t('freelancers.title'));
  const [searchParams, setSearchParams] = useSearchParams();

  const [freelancers, setFreelancers] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  const { user } = useAuth();

  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const [locationInput, setLocationInput] = useState(searchParams.get('location') ?? '');

  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  useEffect(() => {
    setSearchInput(searchParams.get('search') ?? '');
    setLocationInput(searchParams.get('location') ?? '');
  }, [searchParams]);

  // Load categories and skills for filter panel
  useEffect(() => {
    categoryService
      .getCategories()
      .then((res) => {
        if (res.success) setCategories(res.data ?? []);
      })
      .catch(() => {});

    skillService
      .getSkills()
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
      const res = await savedService.getSavedFreelancers({ per_page: 100 });
      if (res.success) {
        const ids = (res.data ?? []).map(
          (s) => String(s.freelancer_profile_id ?? s.freelancer_id ?? s.freelancer?.id ?? s.id)
        );
        setSavedIds(new Set(ids));
      }
    } catch {
      // Silently ignore
    }
  }, [user]);

  useEffect(() => {
    loadSavedState();
  }, [loadSavedState]);

  const handleToggleSave = useCallback(async (freelancerId, isCurrentlySaved) => {
    const targetId = String(freelancerId);
    setSavingId(targetId);
    try {
      if (isCurrentlySaved) {
        await savedService.unsaveFreelancer(targetId);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      } else {
        await savedService.saveFreelancer(targetId);
        setSavedIds((prev) => new Set(prev).add(targetId));
      }
    } catch {
      loadSavedState();
    } finally {
      setSavingId(null);
    }
  }, [loadSavedState]);

  const loadFreelancers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await freelancerService.getFreelancers({
        search: searchParams.get('search') ?? undefined,
        category_id: searchParams.get('category_id') ?? undefined,
        skill_id: searchParams.get('skill_id') ?? undefined,
        experience_level: searchParams.get('experience_level') ?? undefined,
        availability_status: searchParams.get('availability_status') ?? undefined,
        location: searchParams.get('location') ?? undefined,
        min_hourly_rate: searchParams.get('min_hourly_rate') ?? undefined,
        max_hourly_rate: searchParams.get('max_hourly_rate') ?? undefined,
        sort: searchParams.get('sort') ?? undefined,
        page,
      });
      if (response.success) {
        setFreelancers(response.data ?? []);
        setMeta(response.meta ?? null);
      } else {
        setError(response.message || 'Unable to load freelancers.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load freelancers right now.'));
    } finally {
      setLoading(false);
    }
  }, [searchParams, page]);

  useEffect(() => {
    loadFreelancers();
  }, [loadFreelancers]);

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

  return (
    <Container className="py-8 lg:py-12">
      <PageHeader
        eyebrow={t('freelancers.eyebrow')}
        title={t('freelancers.title')}
        description={t('freelancers.description')}
        breadcrumbs={[{ label: t('nav.homeShort'), to: '/' }, { label: t('freelancers.title') }]}
      />

      {/* Guru.com Style Top Horizontal Search & Filter Bar */}
      <div className="mb-6">
        <HorizontalFilterBar
          type="freelancers"
          values={{
            search: searchInput,
            category_id: searchParams.get('category_id') ?? '',
            skill_id: searchParams.get('skill_id') ?? '',
            location: locationInput,
            experience_level: searchParams.get('experience_level') ?? '',
            availability_status: searchParams.get('availability_status') ?? '',
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
            {loading
              ? t('freelancers.loading')
              : total != null
                ? t('freelancers.foundCount', { count: total })
                : ''}
          </p>
        </div>

        <FilterButton
          active={activeFilters.length > 0}
          icon={Users}
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
      {loading && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-gray-200" />
                    <div className="h-3 w-48 rounded bg-gray-200" />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  {Array.from({ length: 3 }, (_, j) => (
                    <div key={j} className="h-5 w-16 rounded-full bg-gray-200" />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <ErrorState
          title={t('common.errorOccurred')}
          description={error}
          onRetry={loadFreelancers}
        />
      )}

      {!loading && !error && freelancers?.length === 0 && (
        <EmptyState
          icon={SearchX}
          title={t('common.noResults')}
          description={t('freelancers.noFreelancers')}
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

      {!loading && !error && freelancers?.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {freelancers.map((freelancer) => (
              <FreelancerCard
                key={freelancer.id}
                freelancer={freelancer}
                savedIds={savedIds}
                onToggleSave={handleToggleSave}
                savingId={savingId}
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
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name or skills…"
              className="w-full rounded-lg border border-gray-300 p-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Category</label>
            <select
              value={searchParams.get('category_id') ?? ''}
              onChange={(e) => updateParams({ category_id: e.target.value })}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={applyTextFilters} className="w-full">
            Apply Filters
          </Button>
        </div>
      </Modal>
    </Container>
  );
}
