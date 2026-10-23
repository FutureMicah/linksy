// Price drop chip. Usage: <DealBadge now={price} was={oldPrice} />. Renders nothing when there is no drop.
export function dealPct(now, was) {
  const n = Number(now)
  const w = Number(was)
  if (!w || !n || w <= n) return 0
  return Math.round((1 - n / w) * 100)
}

export default function DealBadge({ now, was, className = '' }) {
  const pct = dealPct(now, was)
  if (pct <= 0) return null
  return (
    <span className={`deal-badge ${className}`} title={`was ₦${Number(was).toLocaleString()}`}>
      -{pct}%
    </span>
  )
}
