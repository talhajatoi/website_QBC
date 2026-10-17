import { Star } from "lucide-react";
export default function RatingStars({ rating = 0, count, small = false }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${small ? "h-3.5 w-3.5" : "h-4 w-4"} ${star <= Math.round(rating) ? "fill-brand text-brand" : "text-zinc-300"}`}
          />
        ))}
      </span>
      {count !== undefined && (
        <span className="ml-1 text-xs text-zinc-500">({count})</span>
      )}
    </span>
  );
}
