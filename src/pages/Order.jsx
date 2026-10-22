import { useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { formatPrice } from '../lib/format.js'
import { CONFIG } from '../config.js'
import { useReveal } from '../lib/motion.js'
import Magnetic from '../components/Magnetic.jsx'

const STATUS_COPY = {
  awaiting_transfer: { label: 'AWAITING PAYMENT', tone: 'text-amber', note: 'Send the exact transfer, then share proof on WhatsApp.' },
  paid: { label: 'PAID', tone: 'text-lime', note: 'Payment confirmed. Delivery is on its way to your WhatsApp.' },
  delivered: { label: 'DELIVERED', tone: 'text-lime', note: 'Delivered. Thanks for buying from accountplug.' },
  cancelled: { label: 'CANCELLED', tone: 'text-danger', note: 'This order was cancelled and stock returned.' },
}

export default function Order() {
  const { ref } = useParams()
  const order = useStore((s) => s.orders.find((o) => o.id === ref))
  const currency = useStore((s) => s.currency)
  const scope = useRef(null)
  useReveal(scope, [ref])

  if (!order) {
    return (
      <div className="card p-10 text-center">
        <p className="font-display text-xl">Order not found</p>
        <Link to="/" className="btn-ghost mt-4 inline-flex">BACK TO SHOP</Link>
      </div>
    )
  }

  const st = STATUS_COPY[order.status] || STATUS_COPY.awaiting_transfer
  const waText = encodeURIComponent(`Hi accountplug, I placed order ${order.id} (${formatPrice(order.total_ngn, 'NGN')}). Here is my proof of payment.`)

  return (
    <div ref={scope} className="max-w-2xl mx-auto flex flex-col gap-4">
      <div data-reveal className="card p-6">
        <p className="font-display text-xs text-muted tracking-widest">ORDER REFERENCE</p>
        <h1 className="font-display text-3xl md:text-4xl text-lime break-all text-glow">{order.id}</h1>
        <p className={`font-display mt-2 ${st.tone}`}>{st.label}</p>
        <p className="text-sm text-muted mt-1">{st.note}</p>
      </div>

      {order.status === 'awaiting_transfer' && (
        <div data-reveal className="card p-6 flex flex-col gap-2 text-sm">
          <h2 className="font-display">PAY THIS EXACT AMOUNT</h2>
          <div className="font-display text-3xl text-lime">{formatPrice(order.total_ngn, 'NGN')}</div>
          <div>Bank: {CONFIG.bank.name}</div>
          <div>Account name: {CONFIG.bank.accountName}</div>
          <div>Account number: <span className="font-display">{CONFIG.bank.accountNumber}</span></div>
          <div>Narration: <span className="font-display">{order.id}</span></div>
          <Magnetic className="mt-3 self-start">
            <a className="btn" href={`https://wa.me/${CONFIG.supportWhatsapp}?text=${waText}`} target="_blank" rel="noreferrer">
              SEND PROOF ON WHATSAPP
            </a>
          </Magnetic>
        </div>
      )}

      <div data-reveal className="card p-6">
        <h2 className="font-display mb-3">ITEMS</h2>
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between text-sm py-1.5 border-b border-line last:border-0">
            <span className="text-muted">{i.qty}× {i.title}</span>
            <span>{formatPrice(i.qty * i.unit_ngn, currency)}</span>
          </div>
        ))}
        <div className="flex justify-between mt-3">
          <span className="font-display">TOTAL</span>
          <span className="font-display text-lime">{formatPrice(order.total_ngn, currency)}</span>
        </div>
      </div>

      <Link data-reveal to="/" className="btn-ghost self-start">CONTINUE SHOPPING</Link>
    </div>
  )
}
