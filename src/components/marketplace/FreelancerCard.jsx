import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Avatar from './Avatar';
import RatingDisplay from './RatingDisplay';
import PriceDisplay from './PriceDisplay';
import SkillBadge from './SkillBadge';
import VerifiedBadge from './VerifiedBadge';
import StatusBadge from './StatusBadge';
import { useI18n } from '../../i18n';
import { cn } from '../../utils/cn';

/**
 * FreelancerCard — reusable talent profile card.
 *
 * UI-only: receives data via props (sample today, Laravel API later).
 * `sample` renders a "Sample" label so placeholder content is never mistaken
 * for real data. `completion` renders a profile-completion placeholder bar.
 */
export default function FreelancerCard({ freelancer, to, sample = false, className }) {
  const { t } = useI18n();
  const href = to ?? (freelancer?.id ? `/freelancers/${freelancer.id}` : '/freelancers');
  const completion = freelancer?.completion;

  const name = freelancer?.name ?? freelancer?.user?.name ?? 'Freelancer';
  const avatar = freelancer?.avatar ?? freelancer?.user?.avatar;
  const headline = freelancer?.headline;
  const location = freelancer?.location;
  const hourlyRate = freelancer?.hourlyRate ?? freelancer?.hourly_rate;
  const rating = freelancer?.rating;
  const reviews = freelancer?.reviews ?? freelancer?.completedJobsCount ?? freelancer?.completed_jobs_count;
  const availability = freelancer?.availability ?? freelancer?.availability_status;
  const isVerified = freelancer?.verified ?? (freelancer?.verified_credentials?.length > 0);

  return (
    <Card
      className={cn(
        'group relative flex h-full flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <Avatar
          name={name}
          src={avatar}
          size="lg"
          className="transition-transform duration-200 group-hover:scale-105"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-ink-900">
              <Link
                to={href}
                className="transition-colors after:absolute after:inset-0 hover:text-brand-600"
              >
                {name}
              </Link>
            </h3>
            {isVerified && <VerifiedBadge />}
            {sample && !isVerified && <Badge tone="neutral">{t('jobs.sample')}</Badge>}
          </div>
          {headline && <p className="mt-0.5 truncate text-xs text-gray-500">{headline}</p>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
        {location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {location}
          </span>
        )}
        <RatingDisplay rating={rating} count={reviews} />
        {hourlyRate != null && hourlyRate > 0 && (
          <PriceDisplay amount={hourlyRate} interval="hr" />
        )}
      </div>

      {freelancer?.skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {freelancer.skills.map((skill) => (
            <SkillBadge key={skill.id ?? skill}>
              {typeof skill === 'string' ? skill : skill.name}
            </SkillBadge>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
        {availability && (
          <StatusBadge status={availability} dot />
        )}
        {completion != null && (
          <div className="flex min-w-0 items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${Math.max(0, Math.min(100, completion))}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-400">
              {t('freelancers.complete', { count: completion })}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
