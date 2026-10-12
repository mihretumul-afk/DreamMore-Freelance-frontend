import { useState } from 'react';
import { Search, MapPin, SlidersHorizontal, X, ChevronDown, RotateCcw } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Guru.com style Horizontal Top Search & Filter Bar.
 * Sits horizontally across the top above search results.
 */
export default function HorizontalFilterBar({
  type = 'jobs', // 'jobs' | 'freelancers'
  values = {},
  categories = [],
  skills = [],
  onChange,
  onApply,
  onClear,
  className,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const set = (key, value) => onChange?.(key, value);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onApply?.();
  };

  const hasActiveFilters = Object.entries(values).some(([key, val]) => {
    if (key === 'page') return false;
    return val !== undefined && val !== null && val !== '';
  });

  return (
    <div className={cn('rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all', className)}>
      {/* Top Combined Search Bar Row (Guru.com Style) */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex flex-1 items-center rounded-xl border border-gray-300 bg-white shadow-xs focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
          {/* Category Dropdown Left */}
          {categories.length > 0 && (
            <div className="relative shrink-0 border-r border-gray-200 max-w-[100px] sm:max-w-[150px] md:max-w-none">
              <select
                value={values.category_id ?? ''}
                onChange={(e) => set('category_id', e.target.value)}
                className="h-11 w-full appearance-none bg-transparent pl-2.5 sm:pl-3.5 pr-6 sm:pr-8 text-xs font-semibold text-ink-800 focus:outline-none cursor-pointer truncate"
                aria-label="Filter by Category"
              >
                <option value="">Any Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 sm:right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            </div>
          )}

          {/* Search Field */}
          <div className="relative flex flex-1 items-center px-2 sm:px-3 min-w-0">
            <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              value={values.search ?? ''}
              onChange={(e) => set('search', e.target.value)}
              placeholder={
                type === 'jobs'
                  ? 'Search jobs, title, or skills…'
                  : 'Search freelancers, skills, or headline…'
              }
              aria-label="Search term"
              className="w-full min-w-0 bg-transparent py-2.5 pl-2 pr-6 sm:pr-7 text-xs sm:text-sm text-ink-900 placeholder:text-gray-400 focus:outline-none"
            />
            {values.search && (
              <button
                type="button"
                onClick={() => set('search', '')}
                aria-label="Clear search"
                className="absolute right-1.5 sm:right-2 text-gray-400 hover:text-ink-900"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="flex h-11 items-center justify-center rounded-r-xl bg-brand-600 px-3 sm:px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700 shrink-0"
          >
            <Search className="h-4 w-4 md:mr-1.5" />
            <span className="hidden md:inline">Search</span>
          </button>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors',
              isExpanded || hasActiveFilters
                ? 'border-brand-300 bg-brand-50 text-brand-700'
                : 'border-gray-300 bg-white text-ink-700 hover:bg-gray-50'
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                !
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-ink-900"
              title="Clear all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </form>

      {/* Horizontal Filter Options Pill Row */}
      <div
        className={cn(
          'mt-3 pt-3 border-t border-gray-100 flex-wrap items-center gap-2.5',
          isExpanded ? 'flex' : 'hidden md:flex'
        )}
      >
        {/* Location Field */}
        <div className="relative flex-1 min-w-[140px] sm:min-w-[180px]">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={values.location ?? ''}
            onChange={(e) => set('location', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onApply?.()}
            placeholder="Location..."
            className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-xs text-ink-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </div>

        {/* Skills Selector */}
        {skills.length > 0 && (
          <div className="relative min-w-[130px]">
            <select
              value={values.skill_id ?? ''}
              onChange={(e) => set('skill_id', e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-7 py-1.5 text-xs text-ink-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 cursor-pointer"
            >
              <option value="">All Skills</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          </div>
        )}

        {/* Experience Level Selector */}
        <div className="relative min-w-[130px]">
          <select
            value={values.experience_level ?? ''}
            onChange={(e) => set('experience_level', e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-7 py-1.5 text-xs text-ink-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 cursor-pointer"
          >
            <option value="">Any Experience</option>
            <option value="entry">Entry Level</option>
            <option value="intermediate">Intermediate</option>
            <option value="expert">Expert Level</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Budget Type / Availability Specifics */}
        {type === 'jobs' ? (
          <>
            <div className="relative min-w-[120px]">
              <select
                value={values.budget_type ?? ''}
                onChange={(e) => set('budget_type', e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-7 py-1.5 text-xs text-ink-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 cursor-pointer"
              >
                <option value="">Any Budget Type</option>
                <option value="fixed">Fixed Price</option>
                <option value="hourly">Hourly Rate</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="relative min-w-[120px]">
              <select
                value={values.location_type ?? ''}
                onChange={(e) => set('location_type', e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-7 py-1.5 text-xs text-ink-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 cursor-pointer"
              >
                <option value="">Work Mode</option>
                <option value="remote">Remote</option>
                <option value="on_site">On-site</option>
                <option value="hybrid">Hybrid</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            </div>
          </>
        ) : (
          <div className="relative min-w-[130px]">
            <select
              value={values.availability_status ?? ''}
              onChange={(e) => set('availability_status', e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-7 py-1.5 text-xs text-ink-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 cursor-pointer"
            >
              <option value="">Availability</option>
              <option value="available">Available Now</option>
              <option value="busy">Busy</option>
              <option value="not_available">Unavailable</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          </div>
        )}

        {/* Sort Selector */}
        <div className="relative min-w-[130px] sm:ml-auto">
          <select
            value={values.sort ?? ''}
            onChange={(e) => set('sort', e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-7 py-1.5 text-xs text-ink-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 cursor-pointer"
          >
            <option value="">Sort: Newest</option>
            {type === 'jobs' ? (
              <>
                <option value="budget">Highest Budget</option>
                <option value="newest">Most Recent</option>
              </>
            ) : (
              <>
                <option value="rate_low">Hourly Rate: Low to High</option>
                <option value="rate_high">Hourly Rate: High to Low</option>
                <option value="rating">Highest Rated</option>
              </>
            )}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
