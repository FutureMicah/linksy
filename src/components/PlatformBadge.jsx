import { platformFor } from '../lib/platforms.js'

// Brand logo on a tile of the platform's signature color.
export default function PlatformBadge({ listing, size = 'md' }) {
  const p = platformFor(listing)
  if (!p) return null
  const box = size === 'lg' ? 'w-16 h-16 rounded-2xl' : 'w-11 h-11 rounded-xl'
  const img = size === 'lg' ? 'w-9 h-9' : 'w-6 h-6'
  return (
    <span
      className={`platform-badge ${box} grid place-items-center shadow-lg`}
      style={{ background: p.color }}
      title={p.name}
    >
      <img className={`${img} object-contain`} src={`/logos/${p.logo}.svg`} alt={`${p.name} logo`} loading="lazy" decoding="async"
        style={{ filter: 'brightness(0) invert(1)' }} />
    </span>
  )
}
