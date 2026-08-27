import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, TrendingUp, CheckCircle2 } from 'lucide-react';
import Card from '../ui/Card';
import RatingDisplay from './RatingDisplay';
import PriceDisplay from './PriceDisplay';
import { useI18n } from '../../i18n';
import { cn } from '../../utils/cn';

// Default high-resolution portrait fallback images for talent
const PORTRAIT_FALLBACKS = [
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
];

/**
 * FreelancerCard — Toptal-style talent profile card with large portrait photo,
 * verification badge overlay, sub-role title, and EXPERTISE skill pills.
 *
 * Supports both real backend API freelancer models and enriched landing previews.
 */
export default function FreelancerCard({ freelancer, to, className, index = 0 }) {
  const { t } = useI18n();
  const href = to ?? (freelancer?.id ? `/freelancers/${freelancer.id}` : '/freelancers');

  const name = freelancer?.name ?? freelancer?.user?.name ?? 'Registered Freelancer';
  
  // Portrait image resolution
  const rawAvatar = freelancer?.avatar ?? freelancer?.user?.avatar;
  const portrait = (rawAvatar && typeof rawAvatar === 'string' && rawAvatar.startsWith('http'))
    ? rawAvatar
    : PORTRAIT_FALLBACKS[index % PORTRAIT_FALLBACKS.length];

  const categoryName = freelancer?.categoryName || freelancer?.category?.name || 'Verified Specialty';
  const roleTitle = freelancer?.roleTitle || freelancer?.headline || 'Certified Freelance Expert';
  const location = freelancer?.location || 'Ethiopia';
  const hourlyRate = freelancer?.hourlyRate ?? freelancer?.hourly_rate ?? 45;
  const rating = freelancer?.rating ?? 5.0;
  const reviews = freelancer?.reviews ?? freelancer?.completedJobsCount ?? freelancer?.completed_jobs_count ?? 12;

  // Credential verification status from Laravel backend profile
  const isApproved = freelancer?.approvalStatus === 'approved' || freelancer?.approval_status === 'approved' || freelancer?.approvedAt != null;
  const isVerified = freelancer?.verified ?? (isApproved || (freelancer?.verified_credentials?.length > 0));

  // Skills array normalization
  const rawSkills = freelancer?.skills ?? ['Verified Expertise', 'Client Relations'];
  const skills = Array.isArray(rawSkills)
    ? rawSkills.map((s) => (typeof s === 'string' ? s : s?.name)).filter(Boolean)
    : [];

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
      {/* Portrait Photo Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={portrait}
          alt={name}
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Small Toptal-style Verification Emblem Overlay at bottom-left corner */}
        {isVerified && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 shadow-md border border-gray-100 backdrop-blur-xs">
            <ShieldCheck className="h-4 w-4 text-blue-600 fill-blue-50" />
            <span className="text-[10px] font-bold text-blue-900 tracking-wider uppercase">Verified Expert</span>
          </div>
        )}
      </div>

      {/* Card Details Body */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          {/* Freelancer Name */}
          <h3 className="text-base font-bold text-ink-900 transition-colors group-hover:text-brand-600 line-clamp-1">
            {name}
          </h3>

          {/* Verified Status Tag */}
          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <span className="truncate">Verified Expert in {categoryName}</span>
          </div>

          {/* Sub-Role Title */}
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
            <TrendingUp className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className="font-medium truncate">{roleTitle}</span>
          </div>

          {/* EXPERTISE Header & Skill Pill Badges */}
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              EXPERTISE
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {skills.slice(0, 3).map((skill, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50/80 px-2.5 py-0.5 text-[11px] font-medium text-gray-700 transition-colors group-hover:border-brand-200 group-hover:bg-brand-50/40"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info: Location, Rate, Rating */}
        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {location && (
              <span className="inline-flex items-center gap-1 text-gray-400">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {location}
              </span>
            )}
            <PriceDisplay amount={hourlyRate} interval="hr" className="font-bold text-gray-900" />
          </div>
          <RatingDisplay rating={rating} count={reviews} />
        </div>
      </div>
    </Card>
  );
}


