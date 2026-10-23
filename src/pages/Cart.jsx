import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { formatPrice } from '../lib/format.js'
import { useReveal } from '../lib/motion.js'
import Magnetic from '../components/Magnetic.jsx'
import Cover from '../components/Cover.jsx'

export default function Cart() {
  const cart = useStore((s) => s.cart)
  const listings = useStore((s) => s.listings)
  const currency = useStore((s) => s.currency)
  const setQty = useStore((s) => s.setQty)
  const removeFromCart = useStore((s) => s.removeFromCart)
  const scope = useRef(null)

  const lines = cart
    .map((c) => ({ ...c, listing: listings.find((l) => l.id === c.id) }))
    .filter((l) => l.listing)
  const total = lines.reduce((s, l) => s + l.qty * l.listing.price_ngn, 0)
  const unavailable = lines.some((l) => l.listing.status !== 'active' || l.listing.stock < l.qty)
  useReveal(scope, [lines.length])

  if (lines.length === 0) {
    return (
      <div ref={scope} className="card p-10 text-center">
        <p className="font-display text-2xl">Cart is empty</p>
        <p className="text-muted text-sm mt-1">Pick an account or a gift card to get started.</p>
        <Link to="/" className="btn mt-5 inline-flex">BROWSE SHOP</Link>
      </div>
    )
  }

  return (
    <div ref={scope} className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 flex flex-col gap-3">
        <h1 data-reveal className="font-display text-4xl md:text-5xl">Cart</h1>
        {lines.map(({ id, qty, listing }) => (
          <div key={id} data-reveal className="card p-3 md:p-4 flex gap-3 items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl overflow-hidden">
              <Cover listing={listing} className="h-full w-full" />
            </div>
            <div className="flex-1 min-w-0">
              <Link to={`/product/${id}`} className="font-semibold hover:text-lime-ink line-clamp-2">{listing.title}</Link>
              <div className="text-sm text-lime-ink font-display mt-1">{formatPrice(listing.price_ngn, currency)}</div>
              {(listing.status !== 'active' || listing.stock < qty) && (
                <div className="text-xs text-danger mt-1">No longer available in this quantity. Remove it to continue.</div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center border border-line">
                <button className="px-3 py-1.5 hover:text-lime-ink" onClick={() => setQty(id, qty - 1)}>−</button>
                <span className="px-3 font-display">{qty}</span>
                <button className="px-3 py-1.5 hover:text-lime-ink disabled:opacity-30" onClick={() => setQty(id, qty + 1)} disabled={qty >= listing.stock}>+</button>
              </div>
              <button className="text-xs text-danger font-display" onClick={() => removeFromCart(id)}>REMOVE</button>
            </div>
          </div>
        ))}
      </div>

      <aside data-reveal className="card p-5 h-fit flex flex-col gap-3 md:sticky md:top-24">
        <h2 className="font-display text-lg">Summary</h2>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Items</span>
          <span>{lines.reduce((n, l) => n + l.qty, 0)}</span>
        </div>
        <div className="flex justify-between items-end">
          <span className="font-display">TOTAL</span>
          <span className="font-display text-3xl text-lime-ink text-glow">{formatPrice(total, currency)}</span>
        </div>
        <Magnetic>
          <Link
            to="/checkout"
            aria-disabled={unavailable}
            onClick={(e) => unavailable && e.preventDefault()}
            className={`btn w-full ${unavailable ? 'opacity-40 pointer-events-none' : ''}`}
          >
            CHECKOUT
          </Link>
        </Magnetic>
        <p className="text-xs text-muted">Pay by bank transfer. Stock is held for your order as soon as you place it.</p>
      </aside>
    </div>
  )
}
