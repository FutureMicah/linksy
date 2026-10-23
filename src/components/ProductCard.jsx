import PlatformBadge from './PlatformBadge.jsx'
import { memo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { formatPrice, stockLabel } from '../lib/format.js'
import { categoryById } from '../config.js'
import Cover from './Cover.jsx'
import VerifiedSeller from './VerifiedSeller.jsx'
import { gsap, useGSAP, reducedMotion } from '../lib/motion.js'

const toneClass = {
  lime: 'text-lime border-lime/40 bg-lime/5',
  amber: 'text-amber border-amber/50 bg-amber/5',
  danger: 'text-danger border-danger/50 bg-danger/5',
}

function ProductCard({ listing }) {
  const currency = useStore((s) => s.currency)
  const addToCart = useStore((s) => s.addToCart)
  const stock = stockLabel(listing)
  const soldOut = listing.status === 'sold' || listing.stock <= 0
  const cat = categoryById(listing.category)
  const ref = useRef(null)
  const btnRef = useRef(null)

  // tilt toward the pointer: mouse on hover, finger while pressed on touch (smaller amplitude)
  useGSAP(
    () => {
      const el = ref.current
      if (!el || reducedMotion()) return
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' })
      const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' })
      let touching = false
      const aim = (e, amp) => {
        const r = el.getBoundingClientRect()
        ry(((e.clientX - r.left) / r.width - 0.5) * amp)
        rx(-((e.clientY - r.top) / r.height - 0.5) * amp)
      }
      const move = (e) => {
        if (e.pointerType === 'mouse') aim(e, 8)
        else if (touching) aim(e, 5)
      }
      const down = (e) => {
        if (e.pointerType !== 'mouse') {
          touching = true
          aim(e, 5)
          el.classList.add('swept')
        }
      }
      const up = () => {
        if (!touching) return
        touching = false
        rx(0)
        ry(0)
      }
      const leave = (e) => {
        if (e.pointerType === 'mouse') {
          rx(0)
          ry(0)
        }
      }
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerdown', down)
      el.addEventListener('pointerup', up)
      el.addEventListener('pointercancel', up)
      el.addEventListener('pointerleave', leave)
      return () => {
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerdown', down)
        el.removeEventListener('pointerup', up)
        el.removeEventListener('pointercancel', up)
        el.removeEventListener('pointerleave', leave)
      }
    },
    { scope: ref },
  )

  const onAdd = () => {
    const ok = addToCart(listing.id)
    if (ok && btnRef.current && !reducedMotion()) {
      gsap.fromTo(btnRef.current, { scale: 0.9 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' })
    }
  }

  return (
    <div data-io="slide" data-io-stagger="75" className="tile-wrap relative">
      <span className="tile-bloom" aria-hidden="true" />
      <div
        ref={ref}
        style={{ transformPerspective: 900 }}
        data-ripple
        className="tile card sheen flex flex-col overflow-hidden group"
      >
        <Link to={`/product/${listing.id}`} className="block">
          <div className="tile-media relative h-40 md:h-48">
            <div data-drift="0.12" className="h-full w-full scale-[1.12]">
              <Cover listing={listing} className="h-full w-full" />
            </div>
            <span className="absolute bottom-2.5 left-2.5"><PlatformBadge listing={listing} /></span>
            {listing.featured && !soldOut && (
              <span className="absolute top-2.5 left-2.5 bg-amber text-ink font-display text-[10px] px-2 py-0.5">FEATURED</span>
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
          <Link to={`/product/${listing.id}`} className="font-semibold leading-snug line-clamp-2 hover:text-lime transition-colors">
            {listing.title}
          </Link>
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <div className="min-w-0">
              <div className="font-display text-xl md:text-2xl text-bone">{formatPrice(listing.price_ngn, currency)}</div>
              <span className={`inline-block mt-1.5 text-[10px] font-display border px-1.5 py-0.5 ${toneClass[stock.tone]}`}>
                {stock.text}
              </span>
            </div>
            <button ref={btnRef} disabled={soldOut} onClick={onAdd} className="btn !py-2 !px-3 !text-xs shrink-0">
              ADD
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(ProductCard)
