import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { formatPrice, stockLabel } from '../lib/format.js'
import { categoryById } from '../config.js'
import Cover from './Cover.jsx'
import { reducedMotion } from '../lib/motion.js'

const INTERVAL_MS = 5000
const HOLD_MS = 6000
const SWIPE_PX = 40

// Auto-rotating, swipeable hero of featured listings. Transform-only motion.
export default function FeaturedCarousel() {
  const listings = useStore((s) => s.listings)
  const currency = useStore((s) => s.currency)

  const items = useMemo(() => {
    const live = listings.filter((l) => l.status === 'active' && l.stock > 0)
    const featured = live.filter((l) => l.featured)
    return (featured.length ? featured : live).slice(0, 5)
  }, [listings])

  const n = items.length
  const [index, setIndex] = useState(0)
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const [hold, setHold] = useState(false)
  const trackRef = useRef(null)
  const drag = useRef({ active: false, startX: 0, dx: 0 })
  const holdTimer = useRef(null)
  const prevIndex = useRef(0)

  useEffect(() => () => clearTimeout(holdTimer.current), [])

  const safeIndex = n ? index % n : 0

  // depth-rotate: the newly active slide swings in on Y, direction follows the move (wraps count as a step)
  useEffect(() => {
    const track = trackRef.current
    if (!track || reducedMotion()) {
      prevIndex.current = safeIndex
      return
    }
    const el = track.children[safeIndex]
    if (!el) return
    const dir = safeIndex >= prevIndex.current ? 1 : -1
    prevIndex.current = safeIndex
    el.style.setProperty('--rot', `${dir * 12}deg`)
    el.classList.remove('depth-in')
    void el.offsetWidth // restart the keyframe
    el.classList.add('depth-in')
  }, [safeIndex])
  const paused = hover || focus || hold || n < 2

  // auto-rotate every ~5s; restarts whenever the slide changes
  useEffect(() => {
    if (paused || reducedMotion()) return
    const t = setTimeout(() => setIndex((v) => (v + 1) % n), INTERVAL_MS)
    return () => clearTimeout(t)
  }, [safeIndex, paused, n])

  const pauseBriefly = () => {
    setHold(true)
    clearTimeout(holdTimer.current)
    holdTimer.current = setTimeout(() => setHold(false), HOLD_MS)
  }

  const go = (i) => {
    pauseBriefly()
    setIndex(((i % n) + n) % n)
  }

  // swipe: pointer events, vertical scroll stays native (touch-action: pan-y)
  const setTrack = (dx, animate) => {
    const el = trackRef.current
    if (!el) return
    el.style.transition = animate ? '' : 'none'
    el.style.transform = `translate3d(calc(${-safeIndex * 100}% + ${dx}px), 0, 0)`
  }

  const onPointerDown = (e) => {
    if (n < 2 || e.button > 0) return
    drag.current = { active: true, startX: e.clientX, dx: 0 }
    pauseBriefly()
    setTrack(0, false)
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d.active) return
    d.dx = e.clientX - d.startX
    setTrack(d.dx * 0.9, false)
  }
  const endDrag = () => {
    const d = drag.current
    if (!d.active) return
    drag.current = { active: false, startX: 0, dx: 0 }
    if (d.dx <= -SWIPE_PX) go(safeIndex + 1)
    else if (d.dx >= SWIPE_PX) go(safeIndex - 1)
    else setTrack(0, true)
  }

  if (!n) return null

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured listings"
      className="deal-ring relative overflow-hidden rounded-[2rem] border border-white bg-panel shadow-[0_30px_60px_-36px_rgba(14,124,134,0.45)] md:rounded-[2.5rem]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
    >
      <div
        className="relative touch-pan-y select-none overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
      >
        <div
          ref={trackRef}
          className="flex will-change-transform"
          style={{
            transform: `translate3d(${-safeIndex * 100}%, 0, 0)`,
            transition: 'transform 0.7s var(--ease-out-expo)',
          }}
        >
          {items.map((l, i) => {
            const cat = categoryById(l.category)
            const stock = stockLabel(l)
            return (
              <div
                key={l.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${n}`}
                aria-hidden={i !== safeIndex}
                className="slide-3d relative h-[300px] w-full shrink-0 md:h-[380px]"
              >
                <Cover
                  listing={l}
                  eager={i === 0}
                  className="absolute inset-0 h-full w-full"
                />
                <div className="absolute inset-0 bg-linear-to-t from-white via-white/55 to-transparent" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 md:p-10">
                  <span className="w-fit rounded-full bg-amber px-3 py-1 font-display text-[10px] tracking-[0.2em] text-white">
                    FEATURED · {cat?.short?.toUpperCase()}
                  </span>
                  <h2 className="font-display text-2xl leading-tight text-bone md:text-4xl line-clamp-2 max-w-xl">{l.title}</h2>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <span className="font-display text-xl text-bone md:text-2xl">{formatPrice(l.price_ngn, currency)}</span>
                    <span className="text-[10px] font-display border border-lime/40 bg-white/80 px-1.5 py-0.5 text-lime">{stock.text}</span>
                  </div>
                  <div className="pt-1">
                    <Link
                      to={`/product/${l.id}`}
                      tabIndex={i === safeIndex ? 0 : -1}
                      draggable={false}
                      className="btn !py-2.5 !px-5 !text-sm"
                    >
                      View listing
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 md:bottom-5 md:left-auto md:right-8 md:justify-end" role="tablist" aria-label="Choose featured slide">
        {items.map((l, i) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={i === safeIndex}
            aria-label={`Show ${l.title}`}
            onClick={() => go(i)}
            className={`h-2 rounded-full transition-all duration-500 ${i === safeIndex ? 'w-6 bg-lime' : 'w-2 bg-bone/25 hover:bg-bone/50'}`}
          />
        ))}
      </div>
    </section>
  )
}
