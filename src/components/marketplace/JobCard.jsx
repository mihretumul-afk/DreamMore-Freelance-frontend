import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Bookmark, Briefcase } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import SkillBadge from './SkillBadge';
import PriceDisplay from './PriceDisplay';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n';

/**
 * JobCard — reusable job listing card.
 *
 * `savable` shows the bookmark control wired to the real saved-jobs API.
 * When savable is true the card calls `onSave(jobId)` / `onUnsave(jobId)`
 * callbacks so the parent page owns the async state.
 *
 * Expected shape (all optional except title):
 * { id, title, company, category, location, budget, interval, jobType,
 *   experienceLevel, postedAt, proposalCount, skills[], featured, saved }
 */
export default function JobCard({ job, to, sample = false, savable = false, onSave, onUnsave, saving = false, className }) {
  const [localSaved, setLocalSaved] = useState(Boolean(job?.saved));
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const href = to ?? (job?.id ? `/jobs/${job.id}` : '/jobs');
  const jobType = job?.jobType || job?.type;

  // Keep localSaved in sync with prop changes.
  if (job?.saved !== undefined && job.saved !== localSaved) {
    setLocalSaved(job.saved);
  }

  const handleToggleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    if (localSaved) {
      setLocalSaved(false);
      onUnsave?.(job?.id);
    } else {
      setLocalSaved(true);
      onSave?.(job?.id);
    }
  };

  return (
    <Card
      className={cn(
        'relative flex h-full flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover',
        className,
      )}
    >
      {/* Stretched link covers the card; interactive controls sit above it */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold leading-snug text-ink-900">
          <Link
            to={href}
            className="transition-colors after:absolute after:inset-0 hover:text-brand-600 focus-visible:outline-none"
          >
            {job?.title}
          </Link>
        </h3>
        {job?.featured ? (
          <Badge tone="primary">{t('jobs.featured')}</Badge>
        ) : sample ? (
          <Badge tone="neutral">{t('jobs.sample')}</Badge>
        ) : null}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
        {job?.company && <span className="font-semibold text-ink-700">{job.company}</span>}
        {job?.category && (
          <span className="inline-flex items-center gap-1 text-brand-600">
            <Briefcase className="h-3.5 w-3.5" aria-hidden="true" /> {job.category}
          </span>
        )}
        {job?.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {job.location}
          </span>
        )}
      </div>

      {job?.skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.map((skill) => (
            <SkillBadge key={skill.id ?? skill}>
              {typeof skill === 'string' ? skill : skill.name}
            </SkillBadge>
          ))}
        </div>
      )}

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <PriceDisplay amount={job?.budget} interval={job?.interval} />
          <div className="flex items-center gap-2">
            {jobType && (
              <Badge tone="info">
                {t(`budgetType.${jobType}`) !== `budgetType.${jobType}`
                  ? t(`budgetType.${jobType}`)
                  : jobType}
              </Badge>
            )}
            {job?.experienceLevel && (
              <span className="hidden text-xs text-gray-400 sm:inline">
                {t(`experience.${job.experienceLevel}`) !== `experience.${job.experienceLevel}`
                  ? t(`experience.${job.experienceLevel}`)
                  : job.experienceLevel}
              </span>
            )}
            {savable && (
              <button
                type="button"
                onClick={handleToggleSave}
                aria-pressed={localSaved}
                aria-label={localSaved ? t('jobs.removeFromSaved') : t('jobs.saveJob')}
                disabled={saving}
                className="relative z-10 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-500 disabled:opacity-50"
              >
                <Bookmark
                  className={cn('h-4 w-4', localSaved && 'fill-brand-500 text-brand-500')}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
          {job?.postedAt && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {job.postedAt}
            </span>
          )}
          {job?.proposalCount != null && (
            <span>
              {t('jobs.proposalCount', { count: job.proposalCount })}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
