import Stars from './Stars.jsx'
import { averageRating, publicName } from '../lib/reviews.js'

function formatDate(iso) {
  return new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ReviewList({ reviews }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted">No reviews yet. Buy and confirm delivery to leave the first one.</p>
  }
  const avg = averageRating(reviews)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl font-semibold">{avg.toFixed(1)}</span>
        <div>
          <Stars value={avg} />
          <div className="text-xs text-muted mt-0.5">{reviews.length} review{reviews.length > 1 ? 's' : ''}</div>
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {reviews.map((r, i) => (
          <li key={`${r.name}-${r.date}-${i}`} className="rounded-2xl border border-line bg-white/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{publicName(r.name)}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-lime/10 text-lime text-[10px] font-medium px-2 py-0.5">
                  ✓ Verified buyer
                </span>
              </div>
              <span className="text-xs text-muted">{formatDate(r.date)}</span>
            </div>
            <div className="mt-1.5"><Stars value={r.rating} size="h-3.5 w-3.5" /></div>
            <p className="text-sm text-bone/85 mt-1.5 leading-relaxed">{r.comment}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
