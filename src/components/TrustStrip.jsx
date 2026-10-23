// Slow marquee of trust signals under the hero. Pauses on hover/focus; CSS only.
const DEFAULT_ITEMS = ['Escrow protected', 'Verified sellers', 'Bank transfer', 'Funds held until you confirm', 'Delivered in chat', '24h inspection window']

export default function TrustStrip({ items }) {
  const ITEMS = items?.length ? items : DEFAULT_ITEMS
  const row = [...ITEMS, ...ITEMS]
  return (
    <div className="trust-strip marquee relative overflow-hidden border-y border-line bg-white/60 py-3" aria-label="trust signals">
      <div className="trust-track marquee-track">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center" aria-hidden={k === 1 ? 'true' : undefined}>
            {row.map((t, i) => (
              <span key={`${k}-${i}`} className="flex items-center font-display text-xs md:text-sm tracking-wide text-muted whitespace-nowrap">
                <span className="px-5">{t}</span>
                <span className="text-lime-ink">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
