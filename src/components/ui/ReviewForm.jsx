import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import Button from './Button';
import Textarea from './Textarea';
import { reviewService } from '../../services/reviewService';
import { getErrorMessage } from '../../utils/errors';

/**
 * ReviewForm — form for submitting a review on a completed contract.
 *
 * Props:
 * - contractId: number
 * - revieweeName: string — name of the person being reviewed
 * - onSubmitted: () => void — called after successful submission
 */
export default function ReviewForm({ contractId, revieweeName, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors = {};
    if (rating < 1 || rating > 5) errors.rating = 'Please select a rating.';
    if (!comment.trim()) errors.comment = 'Please write a review.';
    if (comment.trim().length < 10) errors.comment = 'Review must be at least 10 characters.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await reviewService.submitReview(contractId, {
        rating,
        comment: comment.trim(),
      });
      onSubmitted?.();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        setFieldErrors({
          rating: errors.rating?.[0],
          comment: errors.comment?.[0],
        });
      } else {
        setError(getErrorMessage(err, 'Unable to submit review.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-medium text-ink-900 mb-2">
          Rate your experience with {revieweeName}
        </p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-0.5 transition-colors"
              aria-label={`${star} star${star === 1 ? '' : 's'}`}
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'fill-warning-500 text-warning-500'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-500">{rating}/5</span>
          )}
        </div>
        {fieldErrors.rating && (
          <p role="alert" className="mt-1 text-xs font-medium text-danger-600">
            {fieldErrors.rating}
          </p>
        )}
      </div>

      <Textarea
        label="Your review"
        value={comment}
        onChange={(e) => {
          setComment(e.target.value);
          if (fieldErrors.comment) setFieldErrors((prev) => ({ ...prev, comment: undefined }));
        }}
        placeholder="Share your experience working with this person..."
        rows={4}
        error={fieldErrors.comment}
        disabled={submitting}
      />

      {error && (
        <p role="alert" className="text-sm font-medium text-danger-600">
          {error}
        </p>
      )}

      <Button type="submit" loading={submitting} disabled={submitting}>
        <Send className="h-4 w-4" /> Submit Review
      </Button>
    </form>
  );
}
