import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  MapPin,
  Clock,
  Bookmark,
  Briefcase,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Layers,
  Code2,
  Palette,
  Clapperboard,
  Megaphone,
} from 'lucide-react';
import Container from '../common/Container';
import Badge from '../ui/Badge';
import SkillBadge from '../marketplace/SkillBadge';
import PriceDisplay from '../marketplace/PriceDisplay';
import Avatar from '../marketplace/Avatar';
import HorizontalScrollRow from '../common/HorizontalScrollRow';
import { jobService } from '../../services/jobService';
import { normalizeJob } from '../../utils/jobMapper';
import { useI18n } from '../../i18n';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';

/* ─── Filter Tabs Config ─────────────────────────────────────────────────── */
const FILTER_TABS = [
  { id: 'all', label: 'All Jobs', icon: Layers },
  { id: 'design', label: 'Graphics & Design', icon: Palette, categoryMatch: ['design', 'graphic', 'ui'] },
  { id: 'video', label: 'Video & Audio', icon: Clapperboard, categoryMatch: ['video', 'editing', 'audio'] },
  { id: 'web', label: 'Web & Tech', icon: Code2, categoryMatch: ['web', 'dev', 'tech', 'software', 'app'] },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, categoryMatch: ['market', 'seo', 'social'] },
  { id: 'fixed', label: 'Fixed Price', filterType: 'budget_type', filterVal: 'fixed' },
  { id: 'hourly', label: 'Hourly Rate', filterType: 'budget_type', filterVal: 'hourly' },
];

/* ─── Upwork / Guru Style Job Card ─────────────────────────────────────── */
function FeaturedJobCard({ job }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(Boolean(job?.saved));
  const href = job?.id ? `/jobs/${job.id}` : '/jobs';
  const jobType = job?.jobType || job?.type || (job?.budget_type === 'hourly' ? 'Hourly' : 'Fixed Price');

  const handleToggleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    setSaved(!saved);
  };

  const employerName = job?.company || job?.employer?.name || job?.user?.name || 'Verified Client';

  return (
    <Link
      to={href}
      className="group relative flex h-full flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl"
    >
      <div>
        {/* Top Employer Row */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              name={employerName}
              src={job?.employer?.avatar}
              size="sm"
              variant="brand"
              className="shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="truncate text-xs font-bold text-ink-900">{employerName}</span>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand-500 fill-brand-50 text-brand-600" />
              </div>
              <p className="flex items-center gap-1 text-[11px] text-gray-400">
                <MapPin className="h-3 w-3 shrink-0 text-gray-400" />
                <span className="truncate">{job?.location || 'Remote / Global'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {job?.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-700 border border-amber-200/70">
                <Sparkles className="h-3 w-3" /> Featured
              </span>
            )}
            <button
              type="button"
              onClick={handleToggleSave}
              aria-label={saved ? 'Remove saved job' : 'Save job'}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-600"
            >
              <Bookmark className={cn('h-4 w-4', saved && 'fill-brand-600 text-brand-600')} />
            </button>
          </div>
        </div>

        {/* Job Title */}
        <h3 className="mt-3.5 text-base font-bold leading-snug text-ink-900 transition-colors group-hover:text-brand-600 line-clamp-2">
          {job?.title}
        </h3>

        {/* Description Snippet Preview */}
        <p className="mt-1.5 text-xs text-gray-500 leading-relaxed line-clamp-2">
          {job?.description || 'Looking for an experienced professional to execute high-quality project deliverables.'}
        </p>

        {/* Skill Badges */}
        {job?.skills?.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {job.skills.slice(0, 3).map((skill) => (
              <SkillBadge key={skill.id ?? skill}>
                {typeof skill === 'string' ? skill : skill.name}
              </SkillBadge>
            ))}
            {job.skills.length > 3 && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                +{job.skills.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer Financials & Meta */}
      <div className="mt-5 border-t border-gray-100 pt-3.5">
        <div className="flex items-center justify-between gap-2">
          {/* Price Callout */}
          <div className="rounded-xl bg-brand-50/70 border border-brand-100 px-2.5 py-1">
            <PriceDisplay amount={job?.budget} interval={job?.interval} className="text-sm font-black text-brand-700" />
          </div>

          <div className="flex items-center gap-1.5">
            <Badge tone="info" size="xs" className="font-semibold">
              {jobType}
            </Badge>
            {job?.experienceLevel && (
              <Badge tone="neutral" size="xs" className="capitalize">
                {job.experienceLevel}
              </Badge>
            )}
          </div>
        </div>

        {/* Footer info & Hover Apply Action */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {job?.postedAt || 'Recently posted'}
          </span>

          <span className="inline-flex items-center gap-0.5 font-bold text-brand-600 transition-transform group-hover:translate-x-0.5">
            View Job
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="w-[310px] sm:w-[340px] md:w-[360px] shrink-0 rounded-2xl border border-gray-200 bg-white p-5 animate-pulse snap-start">
      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gray-200" />
          <div className="h-4 w-24 rounded bg-gray-200" />
        </div>
        <div className="h-6 w-6 rounded bg-gray-200" />
      </div>
      <div className="mt-4 h-5 w-3/4 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-full rounded bg-gray-100" />
      <div className="mt-1 h-3 w-2/3 rounded bg-gray-100" />
      <div className="mt-4 flex gap-1.5">
        <div className="h-5 w-16 rounded-full bg-gray-200" />
        <div className="h-5 w-20 rounded-full bg-gray-200" />
      </div>
      <div className="mt-6 border-t border-gray-100 pt-3 flex justify-between items-center">
        <div className="h-7 w-24 rounded-xl bg-gray-200" />
        <div className="h-5 w-16 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}

/* ─── Main Section Component ──────────────────────────────────────────────── */
export default function FeaturedJobsSection() {
  const { t } = useI18n();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    let active = true;
    jobService
      .getJobs({ page: 1 })
      .then((response) => {
        if (!active) return;
        const rawJobs = response?.data ?? (Array.isArray(response) ? response : []);
        setJobs(rawJobs.map(normalizeJob));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Filter jobs based on active Tab
  const filteredJobs = jobs.filter((job) => {
    if (activeTab === 'all') return true;
    const tabConfig = FILTER_TABS.find((t) => t.id === activeTab);
    if (!tabConfig) return true;

    if (tabConfig.filterType === 'budget_type') {
      return job.budget_type === tabConfig.filterVal || job.interval === tabConfig.filterVal;
    }

    if (tabConfig.categoryMatch) {
      const catName = (job.category || '').toLowerCase();
      const jobTitle = (job.title || '').toLowerCase();
      return tabConfig.categoryMatch.some(
        (kw) => catName.includes(kw) || jobTitle.includes(kw)
      );
    }
    return true;
  });

  return (
    <section className="bg-slate-50/70 py-8 lg:py-10 border-b border-gray-100" aria-labelledby="featured-jobs-heading">
      <Container>
        <HorizontalScrollRow
          scrollStep={360}
          renderControls={({ controls }) => (
            <div>
              {/* Section Header */}
              <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
                <div>
                  <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                    Explore Open Gigs
                  </span>
                  <h2 id="featured-jobs-heading" className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                    {t('featuredJobs.title') || 'Latest Job Opportunities'}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-xl">
                    {t('featuredJobs.description') || 'Hand-picked jobs from employers across Ethiopia and beyond.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    to="/jobs"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-brand-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-brand-600 shadow-2xs transition-all duration-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {t('featuredJobs.viewAll') || 'View All Jobs'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  {/* Horizontal Scroll Arrow Navigation Controls */}
                  {controls}
                </div>
              </div>

              {/* Interactive Category Filter Pills Bar */}
              <div className="mt-5 flex overflow-x-auto no-scrollbar items-center gap-2 pb-2">
                {FILTER_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200',
                        isActive
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                          : 'bg-white text-ink-700 border border-gray-200/80 hover:bg-gray-50 hover:text-brand-600'
                      )}
                    >
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        >
          {/* Horizontal Slider Content Row */}
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))
          ) : filteredJobs.length === 0 ? (
            <div className="w-full rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center my-2">
              <Briefcase className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-semibold text-ink-900">No jobs found in this filter</p>
              <p className="mt-1 text-xs text-gray-500">
                Try selecting "All Jobs" or explore all open listings.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="w-[310px] sm:w-[340px] md:w-[360px] shrink-0 snap-start flex"
              >
                <FeaturedJobCard job={job} />
              </div>
            ))
          )}
        </HorizontalScrollRow>
      </Container>
    </section>
  );
}
