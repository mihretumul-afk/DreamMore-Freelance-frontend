import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, TrendingUp, CheckCircle2, Bookmark, Star, Clock, Zap } from 'lucide-react';
import Card from '../ui/Card';
import { useI18n } from '../../i18n';
import { cn } from '../../utils/cn';
import { getPlatformCurrency } from '../../utils/format';

// Default high-resolution portrait fallback images for talent
const PORTRAIT_FALLBACKS = [
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
];

// Color palette for skill pills — cycles through attractive gradients
const SKILL_COLORS = [
  { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', hover: 'group-hover:bg-blue-100/60' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', hover: 'group-hover:bg-emerald-100/60' },
  { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', hover: 'group-hover:bg-violet-100/60' },
  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', hover: 'group-hover:bg-amber-100/60' },
  { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', hover: 'group-hover:bg-rose-100/60' },
  { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', hover: 'group-hover:bg-cyan-100/60' },
  { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', hover: 'group-hover:bg-indigo-100/60' },
  { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', hover: 'group-hover:bg-teal-100/60' },
];

// Experience level badge styles
const EXPERIENCE_STYLES = {
  entry: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: '🌱' },
  intermediate: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '⚡' },
  expert: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '🏆' },
};

// Availability status styles
const AVAILABILITY_STYLES = {
  available: { bg: 'bg-emerald-500', dot: 'bg-emerald-400', text: 'text-emerald-700', label: 'Available' },
  busy: { bg: 'bg-amber-500', dot: 'bg-amber-400', text: 'text-amber-700', label: 'Busy' },
  not_available: { bg: 'bg-gray-400', dot: 'bg-gray-300', text: 'text-gray-500', label: 'Unavailable' },
};

/**
 * FreelancerCard — Redesigned card with professional headline, hourly rate,
 * experience level, location, availability, and colorful skill badges.
 */
export default function FreelancerCard({
  freelancer,
  to,
  className,
  index = 0,
  savable = false,
  isSaved = false,
  onToggleSave,
  saving = false,
}) {
  const { t } = useI18n();
  const href = to ?? (freelancer?.id ? `/freelancers/${freelancer.id}` : '/freelancers');

  // Name
  const name = freelancer?.name ?? freelancer?.user?.name ?? 'Registered Freelancer';

  // Portrait image resolution
  const rawAvatar = freelancer?.avatar ?? freelancer?.user?.avatar;
  const portrait =
    rawAvatar && typeof rawAvatar === 'string' && rawAvatar.startsWith('http')
      ? rawAvatar
      : PORTRAIT_FALLBACKS[index % PORTRAIT_FALLBACKS.length];

  // Profile fields
  const headline = freelancer?.headline || freelancer?.roleTitle || 'Certified Freelance Expert';
  const location = freelancer?.location || null;
  const hourlyRate = freelancer?.hourlyRate ?? freelancer?.hourly_rate ?? null;
  const rating = freelancer?.rating ?? 0;
  const reviews = freelancer?.completedJobsCount ?? freelancer?.completed_jobs_count ?? 0;

  // Experience level
  const experienceLevel = freelancer?.experienceLevel ?? freelancer?.experience_level ?? null;
  const experienceStyle = EXPERIENCE_STYLES[experienceLevel] || EXPERIENCE_STYLES.intermediate;

  // Availability
  const availability = freelancer?.availability ?? freelancer?.availability_status ?? 'available';
  const availStyle = AVAILABILITY_STYLES[availability] || AVAILABILITY_STYLES.available;

  // Credential verification status
  const isApproved =
    freelancer?.approvalStatus === 'approved' ||
    freelancer?.approval_status === 'approved' ||
    freelancer?.approvedAt != null;
  const isVerified = freelancer?.verified ?? (isApproved || freelancer?.verified_credentials?.length > 0);

  // Skills array normalization
  const rawSkills = freelancer?.skills ?? [];
  const skills = Array.isArray(rawSkills)
    ? rawSkills.map((s) => (typeof s === 'string' ? s : s?.name)).filter(Boolean)
    : [];

  const handleBookmarkClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSave?.(freelancer?.id, isSaved);
  };

  return (
    <Card
      as={Link}
      to={href}
      interactive
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-xs transition-all duration-300',
        'hover:-translate-y-1.5 hover:shadow-card-hover hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        className,
      )}
    >
      {/* Banner & Bookmark */}
      <div className="relative h-16 w-full bg-gradient-to-r from-brand-500/10 via-blue-500/10 to-emerald-500/10 dark:from-brand-900/30 dark:via-blue-900/30 dark:to-emerald-900/30">
        {savable && (
          <button
            type="button"
            onClick={handleBookmarkClick}
            disabled={saving}
            aria-pressed={isSaved}
            aria-label={isSaved ? 'Remove from saved' : 'Save freelancer'}
            title={isSaved ? 'Remove from saved' : 'Save freelancer'}
            className="absolute top-2.5 right-2.5 z-10 rounded-full bg-white/90 dark:bg-slate-800/90 p-2 shadow-xs backdrop-blur-xs transition-all hover:bg-white hover:scale-110 disabled:opacity-50"
          >
            <Bookmark
              className={cn(
                'h-4 w-4 transition-colors',
                isSaved ? 'fill-brand-600 text-brand-600' : 'text-gray-600 dark:text-gray-300 hover:text-brand-600',
              )}
            />
          </button>
        )}
      </div>

      {/* Circle Profile Avatar Header */}
      <div className="relative -mt-10 mb-1 flex justify-center px-4">
        <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 shadow-md overflow-hidden">
          <img
            src={portrait}
            alt={name}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        </div>

        {/* Verified Badge Overlay on Circle */}
        {isVerified && (
          <div className="absolute bottom-0 right-1/2 translate-x-8 sm:translate-x-10 translate-y-1 flex items-center gap-0.5 rounded-full bg-white dark:bg-slate-800 px-1.5 py-0.5 shadow-md border border-blue-100 dark:border-blue-900" title="Verified Freelancer">
            <ShieldCheck className="h-4 w-4 text-blue-600 fill-blue-50 dark:text-blue-400 dark:fill-blue-950" />
          </div>
        )}
      </div>

      {/* Card Details Body */}
      <div className="flex flex-1 flex-col justify-between p-4 pt-1 text-center">
        <div>
          {/* Freelancer Name */}
          <h3 className="text-base font-bold text-gray-900 dark:text-white transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400 line-clamp-1">
            {name}
          </h3>

          {/* Professional Headline */}
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed min-h-[32px]">
            {headline}
          </p>

          {/* Availability & Hourly Rate Row */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-gray-50 dark:bg-slate-800/80 px-2.5 py-1 border border-gray-100 dark:border-slate-750">
              <span className={cn('h-2 w-2 rounded-full', availStyle.dot)} />
              <span className={cn('text-[11px] font-semibold', availStyle.text)}>{availStyle.label}</span>
            </div>

            {hourlyRate != null && (
              <div className="flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1">
                <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                  {getPlatformCurrency()} {Number(hourlyRate).toLocaleString('en-US')}
                </span>
                <span className="text-[9px] font-medium text-emerald-500 dark:text-emerald-400">/hr</span>
              </div>
            )}
          </div>

          {/* Experience Level & Rating Row */}
          <div className="mt-2.5 flex items-center justify-center gap-2">
            {experienceLevel && (
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                experienceStyle.bg, experienceStyle.text, experienceStyle.border
              )}>
                <span>{experienceStyle.icon}</span>
                {experienceLevel === 'entry' ? 'Entry' : experienceLevel === 'intermediate' ? 'Mid-Level' : 'Expert'}
              </span>
            )}
            {rating > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {Number(rating).toFixed(1)}
                {reviews > 0 && <span className="text-gray-400 dark:text-slate-500 font-normal">({reviews})</span>}
              </span>
            )}
          </div>

          {/* Location */}
          {location && (
            <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-gray-400 dark:text-slate-500">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}

          {/* Skills with Colorful Pills */}
          {skills.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap justify-center gap-1.5">
                {skills.slice(0, 3).map((skill, i) => {
                  const color = SKILL_COLORS[i % SKILL_COLORS.length];
                  return (
                    <span
                      key={i}
                      className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors',
                        color.bg, color.text, color.border, color.hover
                      )}
                    >
                      {skill}
                    </span>
                  );
                })}
                {skills.length > 3 && (
                  <span className="inline-flex items-center rounded-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-slate-400">
                    +{skills.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Completed Jobs */}
        {reviews > 0 && (
          <div className="mt-3 flex items-center justify-center gap-1.5 border-t border-gray-100 dark:border-slate-800 pt-2.5 text-[11px] text-gray-400 dark:text-slate-500">
            <Zap className="h-3 w-3 text-emerald-500" />
            <span>
              <span className="font-semibold text-gray-600 dark:text-slate-300">{reviews}</span> completed job{reviews !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
