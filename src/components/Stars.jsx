// Star row. interactive=true renders a 1-5 picker.
export default function Stars({ value = 0, onChange, size = 'h-4 w-4', label = 'rating' }) {
  const interactive = typeof onChange === 'function'
  return (
    <div className="inline-flex items-center gap-0.5" role={interactive ? 'radiogroup' : 'img'} aria-label={interactive ? label : `${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= Math.round(value)
        const star = (
          <svg viewBox="0 0 24 24" className={`${size} ${on ? 'text-lime-ink' : 'text-line'}`} fill="currentColor" aria-hidden="true">
            <path d="M12 2.8l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.6 6.1 20.8l1.2-6.5L2.5 9.7l6.6-.9z" />
          </svg>
        )
        if (!interactive) return <span key={n}>{star}</span>
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => onChange(n)}
            className="p-0.5 rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-cyan"
          >
            {star}
          </button>
        )
      })}
    </div>
  )
}
