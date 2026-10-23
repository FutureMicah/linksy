// Horizontal "browse the wall" strip. Touch swipes natively; mouse drags with momentum.
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { formatPrice } from '../lib/format.js'
import Cover from './Cover.jsx'
import { useDragScroll } from './fx.jsx'

export default function ArtStrip({ items }) {
  const currency = useStore((s) => s.currency)
  const ref = useRef(null)
  useDragScroll(ref)
  return (
    <div ref={ref} className="snap-row gap-3 pb-2 -mx-4 px-4 md:mx-0 md:px-0" aria-label="Browse listings">
      {items.map((l) => (
        <Link
          key={l.id}
          to={`/product/${l.id}`}
          data-ripple
          className="card flex flex-col overflow-hidden w-[62vw] max-w-[240px] md:w-[220px] shrink-0"
        >
          <div className="relative h-36">
            <Cover listing={l} className="h-full w-full" />
          </div>
          <div className="p-3 flex flex-col gap-1">
            <span className="font-display text-sm line-clamp-1">{l.title}</span>
            <span className="font-display text-lime-ink text-sm">{formatPrice(l.price_ngn, currency)}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
