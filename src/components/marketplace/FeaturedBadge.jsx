import { Zap } from 'lucide-react';

/**
 * FeaturedBadge — visually indicates a featured (boosted) listing.
 * Shown on job cards and freelancer cards in search results.
 */
export default function FeaturedBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 ${className}`}
    >
      <Zap className="h-3 w-3 fill-amber-500" />
      Featured
    </span>
  );
}
