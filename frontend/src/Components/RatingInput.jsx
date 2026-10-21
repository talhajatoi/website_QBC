import { useState } from 'react';
import { Star } from 'lucide-react';

export default function RatingInput({ value = 5, onChange, name = 'rating' }) {
  const [preview, setPreview] = useState(null);
  const [focusRating, setFocusRating] = useState(null);
  const displayedRating = preview !== null
    ? preview
    : focusRating !== null
      ? focusRating
      : Number(value) || 0;

  const selectRating = (rating) => {
    onChange(rating);
    setPreview(null);
  };

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
    <div>
      <input type="hidden" name={name} value={value} />
      <div
        role="radiogroup"
        aria-label="Rate your experience from 1 to 5 stars"
        className="flex w-fit items-center gap-1"
        onMouseLeave={() => setPreview(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocusRating(null);
        }}
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={Number(value) === rating}
            aria-label={`${rating} star${rating === 1 ? '' : 's'} - ${labels[rating]}`}
            title={`${rating} star${rating === 1 ? '' : 's'} - ${labels[rating]}`}
            data-rating={rating}
            tabIndex={Number(value) === rating ? 0 : -1}
            onMouseEnter={() => setPreview(rating)}
            onFocus={() => setFocusRating(rating)}
            onClick={() => selectRating(rating)}
            onKeyDown={(event) => handleKeyDown(event, rating)}
            className="group rounded-lg p-1 transition-transform duration-150 hover:scale-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            <Star
              aria-hidden="true"
              className={`h-8 w-8 transition-colors duration-150 ${
                rating <= displayedRating
                  ? 'fill-amber-400 text-amber-500 drop-shadow-sm'
                  : 'fill-zinc-100 text-zinc-300 group-hover:text-amber-300'
              }`}
            />
          </button>
        ))}
      </div>
      <p className="mt-1 min-h-5 text-sm font-semibold text-zinc-700" aria-live="polite">
        {displayedRating > 0 ? `${displayedRating} out of 5 stars · ${labels[displayedRating]}` : 'Select a rating'}
      </p>
    </div>
  );
}
