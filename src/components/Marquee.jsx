import { useDeferredReady } from '../lib/idle.js'

export default function Marquee({ items }) {
  const ready = useDeferredReady()
  const row = [...items, ...items]
  // decorative: mounts after first paint, reserves the same height so nothing jumps
  return (
    <div className="marquee relative overflow-hidden border-y border-line bg-panel/60 py-3" aria-hidden="true" style={ready ? undefined : { minHeight: 44 }}>
      {ready && (
        <div className="marquee-track">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center">
              {row.map((t, i) => (
                <span key={`${k}-${i}`} className="font-display text-sm md:text-base tracking-widest text-muted flex items-center">
                  <span className="px-6">{t}</span>
                  <span className="text-lime-ink">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
