import {useState} from 'react';
import {Star} from 'lucide-react';

interface StarRatingDisplayProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md';
  showNumeric?: boolean;
}

export function StarRatingDisplay({
  rating,
  count,
  size = 'sm',
  showNumeric = true,
}: StarRatingDisplayProps) {
  const iconClass = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const rounded = Math.round(rating);

  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className="inline-flex items-center gap-0.5"
        aria-label={`Rated ${rating.toFixed(1)} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${iconClass} ${
              star <= rounded
                ? 'fill-[#E63918] text-[#E63918]'
                : 'text-zinc-300 fill-zinc-100'
            }`}
          />
        ))}
      </div>
      {showNumeric && (
        <span className="font-mono tabular-nums text-xs text-zinc-600">
          {rating > 0 ? rating.toFixed(1) : 'New'}
          {typeof count === 'number' && (
            <span className="text-zinc-400"> ({count})</span>
          )}
        </span>
      )}
    </div>
  );
}

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
}

export function StarRatingInput({value, onChange}: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;

  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Select star rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            onClick={() => onChange(star)}
            className="p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 cursor-pointer transition-transform duration-100 hover:scale-110"
          >
            <Star
              className={`w-5 h-5 ${
                active
                  ? 'fill-[#E63918] text-[#E63918]'
                  : 'text-zinc-300 fill-zinc-100'
              }`}
            />
          </button>
        );
      })}
      <span className="ml-2 font-mono tabular-nums text-xs font-semibold text-zinc-800">
        {displayValue} / 5
      </span>
    </div>
  );
}
