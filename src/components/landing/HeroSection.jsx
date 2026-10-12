import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BadgeCheck, ShieldCheck, Banknote, MapPin, Briefcase, Users, SearchX } from 'lucide-react';
import Button from '../ui/Button';
import { useI18n } from '../../i18n';
import { cn } from '../../utils/cn';
import { searchService } from '../../services/searchService';
import { getPlatformCurrency } from '../../utils/format';

const TRUST_BULLETS = [
  { icon: BadgeCheck, key: 'hero.verifiedTalent' },
  { icon: ShieldCheck, key: 'hero.secureContracts' },
  { icon: Banknote, key: 'hero.milestonePayments' },
  { icon: MapPin, key: 'hero.globalReach' },
];

/** Dream More brand categories for quick-search pills. */
const CATEGORY_PILLS = [
  { label: 'Web Development', slug: 'web-development' },
  { label: 'Graphics Design', slug: 'graphic-design' },
  { label: 'Video Editing', slug: 'video-editing' },
  { label: 'Content Creation', slug: 'content-creation' },
  { label: 'AI Training', slug: 'ai-training' },
  { label: 'Digital Marketing', slug: 'digital-marketing' },
  { label: 'UI/UX Design', slug: 'ui-ux-design' },
];

/** Debounce delay in milliseconds. */
const DEBOUNCE_MS = 350;

/** Minimum characters before a search is triggered. */
const MIN_QUERY_LENGTH = 2;

/**
 * HeroSection — transparent background so it can sit on top of a video
 * (VideoShowcase). Light/white text for contrast over dark footage.
 * Global marketplace search with live results dropdown.
 */
export default function HeroSection() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('hire'); // 'hire' | 'work'
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // ── Live search with debounce ──────────────────────────────────
  const performSearch = useCallback(async (searchQuery) => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults(null);
      setDropdownOpen(false);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const response = await searchService.search(trimmed, { per_page: 5 });
      if (response.success) {
        setResults(response.data);
        setDropdownOpen(true);
      }
    } catch {
      // Silently fail — dropdown stays closed
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        performSearch(value);
      }, DEBOUNCE_MS);
    },
    [performSearch],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Search ─────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      setDropdownOpen(false);
      const trimmed = query.trim();
      if (!trimmed) {
        navigate('/jobs');
        return;
      }
      const params = new URLSearchParams({ search: trimmed });
      navigate(`/jobs?${params.toString()}`);
    },
    [query, navigate],
  );

  const handleResultClick = useCallback(
    (type, id) => {
      setDropdownOpen(false);
      if (type === 'job') {
        navigate(`/jobs/${id}`);
      } else {
        navigate(`/freelancers/${id}`);
      }
    },
    [navigate],
  );

  const handleViewAllJobs = useCallback(() => {
    setDropdownOpen(false);
    const trimmed = query.trim();
    const params = trimmed ? `?search=${encodeURIComponent(trimmed)}` : '';
    navigate(`/jobs${params}`);
  }, [query, navigate]);

  const handleViewAllFreelancers = useCallback(() => {
    setDropdownOpen(false);
    const trimmed = query.trim();
    const params = trimmed ? `?search=${encodeURIComponent(trimmed)}` : '';
    navigate(`/freelancers${params}`);
  }, [query, navigate]);

  // ── Mode navigation ────────────────────────────────────────────
  const handleModeChange = useCallback(
    (newMode) => {
      setMode(newMode);
      setDropdownOpen(false);
      if (newMode === 'work') {
        navigate('/jobs');
      } else {
        navigate('/freelancers');
      }
    },
    [navigate],
  );

  const handleCategoryClick = useCallback(
    (slug) => {
      navigate(`/jobs?search=${encodeURIComponent(slug)}`);
    },
    [navigate],
  );

  // ── Mode-aware copy ────────────────────────────────────────────
  const searchPlaceholder =
    mode === 'hire'
      ? t('hero.searchPlaceholderHire') || t('hero.searchPlaceholder')
      : t('hero.searchPlaceholderWork') || t('hero.searchPlaceholder');

  const jobs = results?.jobs ?? [];
  const freelancers = results?.freelancers ?? [];
  const jobsTotal = results?.jobs_total ?? 0;
  const freelancersTotal = results?.freelancers_total ?? 0;
  const hasAnyResults = jobs.length > 0 || freelancers.length > 0;
  const showNoResults = hasSearched && !loading && results && !hasAnyResults;

  return (
    <section className="relative w-full" aria-label="Hero">
      <div className="relative mx-auto max-w-3xl text-center">
        {/* Badge */}
        <span className="inline-flex animate-fade-up items-center gap-1.5 sm:gap-2 rounded-full border border-white/30 bg-white/10 px-3.5 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
          {t('hero.badge')}
        </span>

        {/* Headline */}
        <h1 className="mt-3 sm:mt-4 animate-fade-up text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl" style={{ animationDelay: '80ms' }}>
          {t('hero.title1')}
          <span className="block text-brand-400">{t('hero.title2')}</span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-2.5 sm:mt-3 max-w-2xl animate-fade-up text-xs sm:text-base leading-relaxed text-white/85 px-1" style={{ animationDelay: '160ms' }}>
          {t('hero.description')}
        </p>

        {/* ── Hire / Work Mode Switch ───────────────────────── */}
        <div
          className="mt-4 sm:mt-5 inline-flex animate-fade-up rounded-xl border border-white/25 bg-white/10 p-1 backdrop-blur-sm max-w-full"
          style={{ animationDelay: '240ms' }}
          role="group"
          aria-label="Choose mode"
        >
          <button
            type="button"
            onClick={() => handleModeChange('hire')}
            aria-pressed={mode === 'hire'}
            className={cn(
              'flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all duration-200',
              mode === 'hire'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/15',
            )}
          >
            {t('hero.findTalent')}
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('work')}
            aria-pressed={mode === 'work'}
            className={cn(
              'flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all duration-200',
              mode === 'work'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/15',
            )}
          >
            {t('hero.findJobs')}
          </button>
        </div>

        {/* ── Search Bar with Live Dropdown ────────────────── */}
        <div
          className="mx-auto mt-4 sm:mt-5 max-w-2xl animate-fade-up relative w-full"
          ref={dropdownRef}
          style={{ animationDelay: '320ms' }}
        >
          <form onSubmit={handleSubmit} role="search" className="w-full">
            <div className="rounded-xl sm:rounded-2xl border border-white/40 bg-white p-1.5 sm:p-2 shadow-2xl transition-shadow duration-200 focus-within:shadow-2xl">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="flex flex-1 items-center gap-1.5 sm:gap-2 px-1 sm:px-2 min-w-0">
                  <Search className="h-4 sm:h-5 w-4 sm:w-5 shrink-0 text-gray-400" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => {
                      if (results && (hasAnyResults || showNoResults)) {
                        setDropdownOpen(true);
                      }
                    }}
                    placeholder={searchPlaceholder}
                    aria-label={t('hero.searchAria')}
                    aria-expanded={dropdownOpen}
                    aria-controls="hero-search-results"
                    aria-autocomplete="list"
                    className="w-full min-w-0 bg-transparent py-1.5 sm:py-2 text-xs sm:text-sm text-ink-900 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
                <Button type="submit" size="sm" className="shrink-0 px-3 sm:px-5 text-xs sm:text-sm">
                  {t('hero.search')}
                </Button>
              </div>
            </div>
            <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-white/70">{t('hero.searchHint')}</p>
          </form>

            {/* ── Live Search Results Dropdown ──────────────── */}
            {dropdownOpen && (
              <div
                id="hero-search-results"
                role="listbox"
                aria-label="Search results"
                className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl"
              >
                {loading && (
                  <div className="flex items-center justify-center gap-2 p-6 text-sm text-gray-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    {t('common.loading')}
                  </div>
                )}

                {!loading && showNoResults && (
                  <div className="flex flex-col items-center gap-2 p-8 text-center">
                    <SearchX className="h-10 w-10 text-gray-300" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-500">{t('common.noResults')}</p>
                    <p className="text-xs text-gray-400">
                      {t('hero.noResultsHint') || 'Try different keywords or browse all jobs and talent.'}
                    </p>
                  </div>
                )}

                {!loading && !showNoResults && hasAnyResults && (
                  <div className="divide-y divide-gray-100">
                    {/* Jobs Section */}
                    {jobs.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                            {t('hero.resultJobs') || 'Jobs'}
                            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                              {jobsTotal}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleViewAllJobs}
                            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                          >
                            {t('hero.viewAllJobs') || 'View all'}
                          </button>
                        </div>
                        <div role="group" aria-label="Job results">
                          {jobs.map((job) => (
                            <button
                              key={job.id}
                              type="button"
                              role="option"
                              onClick={() => handleResultClick('job', job.id)}
                              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                            >
                              <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-ink-900">{job.title}</p>
                                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                                  {job.category?.name && <span>{job.category.name}</span>}
                                  {job.skills?.length > 0 && (
                                    <span className="truncate">
                                      {job.skills.slice(0, 3).map((s) => s.name).join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {job.max_budget > 0 && (
                                <span className="shrink-0 text-xs font-medium text-gray-500">
                                  {new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 }).format(job.max_budget)} {getPlatformCurrency()}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Freelancers Section */}
                    {freelancers.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <Users className="h-3.5 w-3.5" aria-hidden="true" />
                            {t('hero.resultTalent') || 'Talent'}
                            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                              {freelancersTotal}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleViewAllFreelancers}
                            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                          >
                            {t('hero.viewAllTalent') || 'View all'}
                          </button>
                        </div>
                        <div role="group" aria-label="Freelancer results">
                          {freelancers.map((freelancer) => (
                            <button
                              key={freelancer.id}
                              type="button"
                              role="option"
                              onClick={() => handleResultClick('freelancer', freelancer.id)}
                              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                            >
                              <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600">
                                {(freelancer.user?.name ?? 'F').charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-ink-900">
                                  {freelancer.user?.name ?? 'Freelancer'}
                                </p>
                                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                                  {freelancer.headline && (
                                    <span className="truncate">{freelancer.headline}</span>
                                  )}
                                  {freelancer.skills?.length > 0 && !freelancer.headline && (
                                    <span className="truncate">
                                      {freelancer.skills.slice(0, 3).map((s) => s.name).join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {freelancer.hourly_rate > 0 && (
                                <span className="shrink-0 text-xs font-medium text-gray-500">
                                  {new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 }).format(freelancer.hourly_rate)} {getPlatformCurrency()}/hr
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Category Pills ────────────────────────────────── */}
          <div
            className="mt-4 sm:mt-5 flex animate-fade-up flex-wrap items-center justify-center gap-1.5 sm:gap-2"
            style={{ animationDelay: '400ms' }}
          >
            {CATEGORY_PILLS.map((cat) => {
              const catKey = `category.${cat.slug}.name`;
              const translated = t(catKey);
              const label = translated && translated !== catKey ? translated : cat.label;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => handleCategoryClick(cat.slug)}
                  className="rounded-full border border-white/30 bg-white/10 px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/20"
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Trust bullets */}
          <ul
            className="mt-4 sm:mt-5 flex animate-fade-up flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2"
            style={{ animationDelay: '480ms' }}
          >
            {TRUST_BULLETS.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.key}
                  className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-white/85"
                >
                  <Icon className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-brand-400 shrink-0" aria-hidden="true" />
                  {t(item.key)}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
  );
}
