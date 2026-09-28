import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Clock, Bookmark, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import Badge from '../ui/Badge';
import SkillBadge from './SkillBadge';
import PriceDisplay from './PriceDisplay';
import Avatar from './Avatar';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n';

/**
 * JobCard — reusable modern marketplace job listing card.
 * Used across Find Jobs page, Saved Jobs, Search, and Landing Page.
 *
 * The entire card is clickable and navigates to the job detail page.
 * The bookmark button uses stopPropagation to avoid navigating.
 */
export default function JobCard({
  job,
  to,
  sample = false,
  savable = false,
  onSave,
  onUnsave,
  saving = false,
  className,
}) {
  const [localSaved, setLocalSaved] = useState(Boolean(job?.saved));
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const jobId = job?.id ?? job?.job_id ?? job?.job?.id;
  const href = to ?? (jobId != null ? `/jobs/${jobId}` : '/jobs');

  const jobType =
    job?.jobType ||
    job?.type ||
    (job?.budget_type === 'hourly' ? 'Hourly' : 'Fixed Price');

  if (job?.saved !== undefined && job.saved !== localSaved) {
    setLocalSaved(job.saved);
  }

  const handleCardClick = (e) => {
    if (e?.target?.closest('button') || e?.target?.closest('a')) {
      return;
    }
    if (href) {
      navigate(href);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(e);
    }
  };

  const handleToggleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    if (localSaved) {
      setLocalSaved(false);
      onUnsave?.(jobId);
    } else {
      setLocalSaved(true);
      onSave?.(jobId);
    }
  };

  const employerName =
    job?.company || job?.employer?.name || job?.user?.name || 'Verified Client';

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative flex h-full flex-col justify-between rounded-card border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 dark:hover:border-brand-500 hover:shadow-xl',
        href && 'cursor-pointer',
        className,
      )}
    >
      <div>
        {/* Top Employer Row */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
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
                <span className="truncate text-xs font-bold text-ink-900 dark:text-slate-100">{employerName}</span>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand-500 fill-brand-50 text-brand-600" />
              </div>
              <p className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-slate-400">
                <MapPin className="h-3 w-3 shrink-0 text-gray-400 dark:text-slate-400" />
                <span className="truncate">{job?.location || 'Remote / Global'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {job?.featured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/70">
                <Sparkles className="h-3 w-3" /> Featured
              </span>
            ) : sample ? (
              <Badge tone="neutral" size="xs">{t('jobs.sample')}</Badge>
            ) : null}

            {savable && (
              <button
                type="button"
                onClick={handleToggleSave}
                aria-pressed={localSaved}
                aria-label={localSaved ? t('jobs.removeFromSaved') : t('jobs.saveJob')}
                disabled={saving}
                className="relative z-10 rounded-lg p-1.5 text-gray-400 dark:text-slate-400 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-brand-600 dark:hover:text-brand-400 disabled:opacity-50"
              >
                <Bookmark
                  className={cn('h-4 w-4', localSaved && 'fill-brand-600 text-brand-600 dark:fill-brand-400 dark:text-brand-400')}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        </div>

        {/* Job Title */}
        <Link
          to={href}
          onClick={(e) => e.stopPropagation()}
          className="inline-block mt-3.5 text-base font-bold leading-snug text-ink-900 dark:text-slate-100 transition-colors hover:text-brand-600 dark:hover:text-brand-400"
        >
          {job?.title}
        </Link>

        {/* Description Snippet Preview */}
        <p className="mt-1.5 text-xs text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-2">
          {job?.description || 'Looking for an experienced professional to execute high-quality project deliverables.'}
        </p>

        {/* Skill Badges */}
        {job?.skills?.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {job.skills.slice(0, 4).map((skill) => (
              <SkillBadge key={skill.id ?? skill}>
                {typeof skill === 'string' ? skill : skill.name}
              </SkillBadge>
            ))}
            {job.skills.length > 4 && (
              <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-slate-300">
                +{job.skills.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer Financials & Meta */}
      <div className="mt-5 border-t border-gray-100 dark:border-slate-800 pt-3.5">
        <div className="flex items-center justify-between gap-2">
          {/* Price Callout */}
          <div className="rounded-xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/50 px-2.5 py-1">
            <PriceDisplay amount={job?.budget} interval={job?.interval} className="text-sm font-black text-brand-700 dark:text-brand-400" />
          </div>

          <div className="flex items-center gap-1.5">
            <Badge tone="info" size="xs" className="font-semibold">
              {t(`budgetType.${jobType}`) !== `budgetType.${jobType}`
                ? t(`budgetType.${jobType}`)
                : jobType}
            </Badge>
            {job?.experienceLevel && (
              <Badge tone="neutral" size="xs" className="capitalize">
                {t(`experience.${job.experienceLevel}`) !== `experience.${job.experienceLevel}`
                  ? t(`experience.${job.experienceLevel}`)
                  : job.experienceLevel}
              </Badge>
            )}
          </div>
        </div>

        {/* Footer info & Hover Apply Action */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {job?.postedAtLabel || job?.postedAt || 'Recently posted'}
          </span>

          <Link
            to={href}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-bold text-brand-600 dark:text-brand-400 transition-colors hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-700 dark:hover:text-brand-300"
          >
            View Job
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
