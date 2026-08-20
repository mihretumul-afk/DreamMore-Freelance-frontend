import { Star } from 'lucide-react';
import Avatar from '../marketplace/Avatar';
import { formatDate } from '../../utils/format';

/**
 * ReviewList — displays a list of reviews with ratings.
 *
 * Props:
 * - reviews: Array<{ id, rating, comment, reviewer_name, reviewer_avatar, contract_title, created_at }>
 * - averageRating: number | null
 * - reviewCount: number
 */
export default function ReviewList({ reviews = [], averageRating = null, reviewCount = 0 }) {
  if (reviews.length === 0) {
    return (
      <div className="py-8 text-center">
        <Star className="mx-auto h-8 w-8 text-gray-300" />
        <p className="mt-2 text-sm text-gray-500">No reviews yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {averageRating !== null && (
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(averageRating)
                    ? 'fill-warning-500 text-warning-500'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-bold text-ink-900">{averageRating}</span>
          <span className="text-xs text-gray-500">
            ({reviewCount} review{reviewCount === 1 ? '' : 's'})
          </span>
        </div>
      )}

      {/* Individual reviews */}
      {reviews.map((review) => (
        <div key={review.id} className="flex gap-3 py-3">
          <Avatar
            name={review.reviewer_name}
            src={review.reviewer_avatar}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-ink-900">{review.reviewer_name}</p>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= review.rating
                        ? 'fill-warning-500 text-warning-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            {review.contract_title && (
              <p className="text-xs text-gray-400">Contract: {review.contract_title}</p>
            )}
            <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{review.comment}</p>
            <p className="mt-1 text-[10px] text-gray-400">{formatDate(review.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
