import { useState } from 'react';
import { Star } from 'lucide-react';

export default function RatingInput({ value = 5, onChange, name = 'rating' }) {
  const [previewProgress, setPreviewProgress] = useState(null);
  const [focusRating, setFocusRating] = useState(null);
  const displayedRating = previewProgress !== null
    ? previewProgress
    : focusRating !== null
      ? focusRating
      : Number(value) || 0;

  const selectRating = (rating) => {
    onChange(rating);
    setPreviewProgress(null);
  };

  const previewStar = (rating) => setPreviewProgress(rating);

  const handleKeyDown = (event, rating) => {
    let nextRating;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') nextRating = Math.min(5, rating + 1);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') nextRating = Math.max(1, rating - 1);
    else if (event.key === 'Home') nextRating = 1;
    else if (event.key === 'End') nextRating = 5;
    else return;

    event.preventDefault();
    selectRating(nextRating);
    event.currentTarget.parentElement?.querySelector(`[data-rating="${nextRating}"]`)?.focus();
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

  return (
    <div className="relative w-fit">
      <input type="hidden" name={name} value={value} />
      <div
        role="radiogroup"
        aria-label="Rate your experience from 1 to 5 stars"
        className="flex w-fit items-center gap-1"
        onPointerLeave={() => setPreviewProgress(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocusRating(null);
        }}
      >
        {[1, 2, 3, 4, 5].map((rating) => {
          const filled = rating <= displayedRating;
          return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={Number(value) === rating}
            aria-label={`${rating} star${rating === 1 ? '' : 's'} - ${labels[rating]}`}
            data-rating={rating}
            tabIndex={Number(value) === rating ? 0 : -1}
            onPointerEnter={() => previewStar(rating)}
            onFocus={() => setFocusRating(rating)}
            onClick={() => selectRating(rating)}
            onKeyDown={(event) => handleKeyDown(event, rating)}
            className="group relative rounded-md p-0.5 transition-transform duration-150 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            <span className="relative block h-5 w-5 sm:h-6 sm:w-6">
              <Star aria-hidden="true" className="absolute inset-0 h-full w-full fill-zinc-100 text-zinc-300" />
              {filled && <Star aria-hidden="true" className="absolute inset-0 h-full w-full fill-amber-400 text-amber-500" />}
            </span>
          </button>
          );
        })}
      </div>
      <span className="sr-only" aria-live="polite">
        {displayedRating > 0
          ? `${Number(displayedRating.toFixed(1))} out of 5 stars, ${labels[Math.round(displayedRating)]}`
          : 'Select a rating'}
      </span>
    </div>
  );
}
