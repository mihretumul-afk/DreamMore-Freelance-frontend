import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Bookmark, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import Card from '../ui/Card';
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
  const href = to ?? (job?.id ? `/jobs/${job.id}` : '/jobs');
  const jobType =
    job?.jobType ||
    job?.type ||
    (job?.budget_type === 'hourly' ? 'Hourly' : 'Fixed Price');

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

  const employerName =
    job?.company || job?.employer?.name || job?.user?.name || 'Verified Client';

  return (
    <Card
      className={cn(
        'group relative flex h-full flex-col justify-between p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl',
        className,
      )}
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
            {job?.featured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-700 border border-amber-200/70">
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
                className="relative z-10 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-600 disabled:opacity-50"
              >
                <Bookmark
                  className={cn('h-4 w-4', localSaved && 'fill-brand-600 text-brand-600')}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        </div>

        {/* Job Title */}
        <h3 className="mt-3.5 text-base font-bold leading-snug text-ink-900">
          <Link
            to={href}
            className="transition-colors after:absolute after:inset-0 hover:text-brand-600 focus-visible:outline-none"
          >
            {job?.title}
          </Link>
        </h3>

        {/* Description Snippet Preview */}
        <p className="mt-1.5 text-xs text-gray-500 leading-relaxed line-clamp-2">
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
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                +{job.skills.length - 4}
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
    </Card>
  );
}
