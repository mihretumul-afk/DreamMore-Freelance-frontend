import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Bookmark, Briefcase } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import SkillBadge from './SkillBadge';
import PriceDisplay from './PriceDisplay';
import { cn } from '../../utils/cn';

/**
 * JobCard — reusable job listing card.
 *
 * UI-only: receives job data via props (sample data today, Laravel API later).
 * `sample` renders a "Sample" label so placeholder content is never mistaken
 * for real marketplace data.
 *
 * Expected shape (all optional except title):
 * { id, title, company, category, location, budget, interval, jobType,
 *   experienceLevel, postedAt, proposalCount, skills[], featured, saved }
 *
 * `savable` shows the bookmark control. It stays off by default — the saved
 * jobs API is not wired yet, so the control is only shown where it is real.
 */
export default function JobCard({ job, to, sample = false, savable = false, className }) {
  const [saved, setSaved] = useState(Boolean(job?.saved));
  const href = to ?? (job?.id ? `/jobs/${job.id}` : '/jobs');
  const jobType = job?.jobType || job?.type;

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
          <Badge tone="primary">Featured</Badge>
        ) : sample ? (
          <Badge tone="neutral">Sample</Badge>
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
            {jobType && <Badge tone="info">{jobType}</Badge>}
            {job?.experienceLevel && (
              <span className="hidden text-xs text-gray-400 sm:inline">
                {job.experienceLevel}
              </span>
            )}
            {savable && (
              <button
                type="button"
                onClick={() => setSaved((prev) => !prev)}
                aria-pressed={saved}
                aria-label={saved ? 'Remove from saved jobs' : 'Save this job'}
                className="relative z-10 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-500"
              >
                <Bookmark
                  className={cn('h-4 w-4', saved && 'fill-brand-500 text-brand-500')}
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
          {job?.proposalCount != null && <span>{job.proposalCount} proposals</span>}
        </div>
      </div>
    </Card>
  );
}
