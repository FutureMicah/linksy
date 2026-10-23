import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { formatPrice } from '../lib/format.js'
import { CONFIG } from '../config.js'
import { useReveal } from '../lib/motion.js'
import Magnetic from '../components/Magnetic.jsx'

export default function Checkout() {
  const navigate = useNavigate()
  const cart = useStore((s) => s.cart)
  const listings = useStore((s) => s.listings)
  const currency = useStore((s) => s.currency)
  const placeOrder = useStore((s) => s.placeOrder)
  const scope = useRef(null)

  const [form, setForm] = useState({ name: '', email: '', phone: '', note: '' })
  const [method, setMethod] = useState('transfer') // 'transfer' | 'card_placeholder'
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const lines = cart
    .map((c) => ({ ...c, listing: listings.find((l) => l.id === c.id) }))
    .filter((l) => l.listing)
  const total = lines.reduce((s, l) => s + l.qty * l.listing.price_ngn, 0)
  useReveal(scope, [lines.length])

  if (lines.length === 0) {
    return (
      <div ref={scope} className="card p-10 text-center">
        <p className="font-display text-xl">Nothing to check out</p>
        <Link to="/" className="btn mt-4 inline-flex">BROWSE SHOP</Link>
      </div>
    )
  }

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.phone.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('Add your name, a valid email, and a WhatsApp or phone number.')
      return
    }
    const unavailable = lines.find((l) => l.listing.status !== 'active' || l.listing.stock < l.qty)
    if (unavailable) {
      setError(`"${unavailable.listing.title}" is no longer available in that quantity. Update your cart.`)
      return
    }
    setSubmitting(true)
    // Placeholder: no payment gateway yet. Order is saved as awaiting_transfer.
    const order = placeOrder({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), note: form.note.trim(), method })
    navigate(`/order/${order.id}`)
  }

  return (
    <div ref={scope} className="grid md:grid-cols-3 gap-6">
      <form onSubmit={submit} className="md:col-span-2 flex flex-col gap-4">
        <h1 data-reveal className="font-display text-4xl md:text-5xl">Checkout</h1>

        <section data-reveal className="card p-5 flex flex-col gap-4">
          <h2 className="font-display">1. YOUR DETAILS</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={form.name} onChange={update('name')} placeholder="Ada Okafor" />
            </div>
            <div>
              <label className="label">WhatsApp / phone</label>
              <input className="input" value={form.phone} onChange={update('phone')} placeholder="080..." />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Email (for receipt)</label>
              <input className="input" type="email" value={form.email} onChange={update('email')} placeholder="you@email.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Note (optional)</label>
              <textarea className="input" rows={2} value={form.note} onChange={update('note')} />
            </div>
          </div>
        </section>

        <section data-reveal className="card p-5 flex flex-col gap-3">
          <h2 className="font-display">2. PAYMENT</h2>
          <label className={`flex gap-3 border p-3 cursor-pointer transition-colors ${method === 'transfer' ? 'border-lime bg-lime/5' : 'border-line'}`}>
            <input type="radio" name="m" checked={method === 'transfer'} onChange={() => setMethod('transfer')} className="mt-1 accent-lime" />
            <div>
              <div className="font-display text-sm">BANK TRANSFER (MANUAL)</div>
              <div className="text-xs text-muted">Transfer the exact total, then send proof on WhatsApp.</div>
            </div>
          </label>
          <label className="flex gap-3 border border-line p-3 opacity-50 cursor-not-allowed">
            <input type="radio" name="m" disabled className="mt-1" />
            <div>
              <div className="font-display text-sm">CARD / PAYSTACK (COMING SOON)</div>
              <div className="text-xs text-muted">Placeholder only. No gateway is connected yet.</div>
            </div>
          </label>

          {method === 'transfer' && (
            <div className="border border-lime/50 p-4 text-sm bg-amber/5 shadow-[0_0_30px_-12px_rgba(255,184,59,0.6)]">
              <div className="font-display text-lime-ink text-xs mb-2">BANK DETAILS (PLACEHOLDER, REPLACE IN .env.local)</div>
              <div>Bank: <span className="text-bone">{CONFIG.bank.name}</span></div>
              <div>Account name: <span className="text-bone">{CONFIG.bank.accountName}</span></div>
              <div>Account number: <span className="text-bone font-display">{CONFIG.bank.accountNumber}</span></div>
              <div className="text-muted text-xs mt-2">Use your order reference as the transfer narration. You will see it on the next page.</div>
            </div>
          )}
        </section>

        <div className="rounded-2xl border border-cyan/25 bg-cyan/5 p-4 text-sm flex gap-3">
          <span aria-hidden="true" className="text-cyan text-lg leading-none">🔒</span>
          <div>
            <div className="font-medium">Your payment is held in escrow by Linksy</div>
            <p className="text-muted text-xs mt-1 leading-relaxed">
              The seller is paid only after you confirm delivery, or after the 24h inspection window closes with no dispute.
              If something is wrong, open a dispute from your order page and funds stay on hold.
            </p>
          </div>
        </div>

        {error && <div className="border border-danger text-danger p-3 text-sm">{error}</div>}

        <Magnetic className="w-full md:w-auto">
          <button disabled={submitting} className="btn w-full md:w-auto" type="submit">
            PLACE ORDER · {formatPrice(total, currency)}
          </button>
        </Magnetic>
      </form>

      <aside data-reveal className="card p-5 h-fit flex flex-col gap-3">
        <h2 className="font-display">ORDER</h2>
        {lines.map((l) => (
          <div key={l.id} className="flex justify-between gap-3 text-sm">
            <span className="text-muted line-clamp-2">{l.qty}× {l.listing.title}</span>
            <span className="shrink-0">{formatPrice(l.qty * l.listing.price_ngn, currency)}</span>
          </div>
        ))}
        <div className="border-t border-line pt-3 flex justify-between">
          <span className="font-display">TOTAL</span>
          <span className="font-display text-lime-ink text-xl">{formatPrice(total, currency)}</span>
        </div>
      </aside>
    </div>
  )
}
