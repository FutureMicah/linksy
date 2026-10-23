import PlatformBadge from './PlatformBadge.jsx'
import { memo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { formatPrice, stockLabel } from '../lib/format.js'
import { categoryById } from '../config.js'
import Cover from './Cover.jsx'
import VerifiedSeller from './VerifiedSeller.jsx'
import { gsap, reducedMotion } from '../lib/motion.js'
import { burstConfetti } from '../lib/confetti.js'

const toneClass = {
  lime: 'text-lime border-lime/40 bg-lime/5',
  amber: 'text-amber border-amber/50 bg-amber/5',
  danger: 'text-danger border-danger/50 bg-danger/5',
}

function ProductCard({ listing, hot = false }) {
  const currency = useStore((s) => s.currency)
  const addToCart = useStore((s) => s.addToCart)
  const stock = stockLabel(listing)
  const soldOut = listing.status === 'sold' || listing.stock <= 0
  const cat = categoryById(listing.category)
  const ref = useRef(null)
  const btnRef = useRef(null)

  // 3D tilt toward the pointer (mouse) or the finger (touch). Plain JS, writes two CSS vars,
  // CSS does the transform. Inner layers read the same vars at different translateZ depths.
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion()) return
    let raf = 0
    let touching = false
    let target = { x: 0, y: 0 }
    const flush = () => {
      raf = 0
      el.style.setProperty('--tx', target.x.toFixed(3))
      el.style.setProperty('--ty', target.y.toFixed(3))
    }
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(flush)
    }
    const aim = (e) => {
      const r = el.getBoundingClientRect()
      target = {
        x: ((e.clientX - r.left) / r.width - 0.5) * 2,
        y: ((e.clientY - r.top) / r.height - 0.5) * 2,
      }
      queue()
    }
    const reset = () => {
      target = { x: 0, y: 0 }
      queue()
    }
    const move = (e) => {
      if (e.pointerType === 'mouse') {
        el.style.setProperty('--amp', '8deg')
        aim(e)
      } else if (touching) aim(e)
    }
    const down = (e) => {
      if (e.pointerType === 'mouse') return
      touching = true
      el.style.setProperty('--amp', '5deg')
      el.classList.add('swept')
      aim(e)
    }
    const up = (e) => {
      if (e.pointerType === 'mouse' || !touching) return
      touching = false
      reset()
    }
    const leave = (e) => {
      if (e.pointerType === 'mouse') reset()
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('pointerleave', leave)
    }
  }, [])

  const onAdd = () => {
    const ok = addToCart(listing.id)
    if (ok && btnRef.current && !reducedMotion()) {
      gsap.fromTo(btnRef.current, { scale: 0.9 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' })
      burstConfetti(btnRef.current)
    }
  }

  return (
    <div data-io="slide" data-io-stagger="75" className="tile-wrap relative">
      <span className="tile-bloom" aria-hidden="true" />
      <div
        ref={ref}
        style={{ perspective: '900px' }}
        data-ripple
        className="tile tilt card sheen flex flex-col overflow-hidden group"
      >
        <Link to={`/product/${listing.id}`} className="block">
          <div className="tile-media relative h-40 md:h-48">
            <div data-drift="0.12" className="h-full w-full scale-[1.12]">
              <div className="tilt-layer h-full w-full" style={{ '--z': '18px', '--sx': '-7px', '--sy': '-5px' }}>
                <Cover listing={listing} className="h-full w-full" />
              </div>
            </div>
            <span className="absolute bottom-2.5 left-2.5"><PlatformBadge listing={listing} /></span>
            {listing.featured && !soldOut && (
              <span className="absolute top-2.5 left-2.5 bg-amber text-ink font-display text-[10px] px-2 py-0.5">FEATURED</span>
            )}
            {hot && !soldOut && <span className="hot-pill" aria-hidden="true">🔥 Hot right now</span>}
            {listing.featured && !soldOut && (
              <span className="festive-ribbon" aria-hidden="true">Holiday Deal</span>
            )}
            {soldOut && (
              <span className="absolute inset-0 grid place-items-center bg-ink/75 font-display text-danger text-lg tracking-widest">
                SOLD OUT
              </span>
            )}
            {!soldOut && <span className="tile-cta" aria-hidden="true">View listing →</span>}
          </div>
        </Link>
        <div className="p-3.5 md:p-4 flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted font-display truncate">
              {cat?.short} · {listing.brand}
            </div>
            <VerifiedSeller compact />
          </div>
          <Link to={`/product/${listing.id}`} className="tilt-layer font-semibold leading-snug line-clamp-2 hover:text-lime transition-colors" style={{ '--z': '12px', '--sx': '-3px', '--sy': '-2px' }}>
            {listing.title}
          </Link>
          <div className="tilt-layer mt-auto flex items-end justify-between gap-2 pt-2" style={{ '--z': '28px', '--sx': '-4px', '--sy': '-3px' }}>
            <div className="min-w-0">
              <div className="font-display text-xl md:text-2xl text-bone">{formatPrice(listing.price_ngn, currency)}</div>
              <span className={`inline-block mt-1.5 text-[10px] font-display border px-1.5 py-0.5 ${toneClass[stock.tone]}`}>
                {stock.text}
              </span>
            </div>
            <button ref={btnRef} disabled={soldOut} onClick={onAdd} className="btn gold-pulse !py-2 !px-3 !text-xs shrink-0">
              ADD
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(ProductCard)
