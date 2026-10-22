import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore, escrowFor } from '../store/useStore.js'
import { formatPrice } from '../lib/format.js'
import { CONFIG } from '../config.js'
import { useReveal } from '../lib/motion.js'
import { ESCROW_LABEL, mediationLink, isInspectionOver, inspectionEndsAt, formatRemaining } from '../lib/escrow.js'
import { useCountdown } from '../components/EscrowTimeline.jsx'
import EscrowTimeline from '../components/EscrowTimeline.jsx'
import ReviewForm from '../components/ReviewForm.jsx'
import Magnetic from '../components/Magnetic.jsx'

const STATUS_COPY = {
  awaiting_transfer: { label: 'AWAITING PAYMENT', tone: 'text-amber', note: 'Send the exact transfer, then share proof on WhatsApp.' },
  paid: { label: 'FUNDS IN ESCROW', tone: 'text-lime', note: 'Payment verified. Linksy holds your money until you confirm delivery.' },
  delivered: { label: 'DELIVERED', tone: 'text-lime', note: 'Details sent. Check the account or code within 24h, then confirm delivery.' },
  cancelled: { label: 'CANCELLED', tone: 'text-danger', note: 'This order was cancelled and stock returned.' },
}

export default function Order() {
  const { ref } = useParams()
  const order = useStore((s) => s.orders.find((o) => o.id === ref))
  const reviewed = useStore((s) => !!s.reviews.find((r) => r.order_id === ref))
  const releaseFunds = useStore((s) => s.releaseFunds)
  const openDispute = useStore((s) => s.openDispute)
  const submitReview = useStore((s) => s.submitReview)
  const currency = useStore((s) => s.currency)
  const scope = useRef(null)
  useReveal(scope, [ref])
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [notice, setNotice] = useState('')
  const endsAt = inspectionEndsAt(escrowFor(order || { escrow: { state: 'pending' } }))
  const remaining = useCountdown(endsAt)

  if (!order) {
    return (
      <div className="card p-10 text-center">
        <p className="font-display text-xl">Order not found</p>
        <Link to="/" className="btn-ghost mt-4 inline-flex">BACK TO SHOP</Link>
      </div>
    )
  }

  const esc = escrowFor(order)
  const st = STATUS_COPY[order.status] || STATUS_COPY.awaiting_transfer
  const isReleased = esc.state === 'released'
  const isRefunded = esc.state === 'refunded'
  const isDisputed = esc.state === 'disputed'
  const windowOver = isInspectionOver(esc)
  const canConfirm = esc.state === 'delivered' && !windowOver
  const canRelease = esc.state === 'delivered' && windowOver
  const canDispute = esc.state === 'held' || esc.state === 'delivered'
  const waText = encodeURIComponent(`Hi linksy, I placed order ${order.id} (${formatPrice(order.total_ngn, 'NGN')}). Here is my proof of payment.`)
  const total = formatPrice(order.total_ngn, 'NGN')

  const confirmRelease = () => {
    if (releaseFunds(order.id)) setNotice('Delivery confirmed. Funds released to the seller.')
  }

  const submitDispute = (e) => {
    e.preventDefault()
    if (openDispute(order.id, reason.trim())) {
      setDisputeOpen(false)
      setNotice('Dispute opened. Funds are on hold until Linksy reviews it. Message us on WhatsApp so we can mediate.')
    }
  }

  return (
    <div ref={scope} className="max-w-2xl mx-auto flex flex-col gap-4">
      <div data-reveal className="card p-6">
        <p className="text-xs text-muted tracking-widest font-display">ORDER REFERENCE</p>
        <h1 className="font-display text-3xl md:text-4xl break-all">{order.id}</h1>
        <p className={`font-display mt-2 ${st.tone}`}>{st.label}</p>
        <p className="text-sm text-muted mt-1">{st.note}</p>
        {isDisputed && <p className="mt-2 text-sm text-danger font-medium">Disputed. Funds are on hold.</p>}
        {isRefunded && <p className="mt-2 text-sm text-danger font-medium">Refunded to buyer.</p>}
      </div>

      {notice && <div data-reveal className="card p-4 text-sm text-lime">{notice}</div>}

      {order.status === 'awaiting_transfer' && (
        <div data-reveal className="card p-6 flex flex-col gap-2 text-sm">
          <h2 className="font-display">PAY THIS EXACT AMOUNT</h2>
          <div className="font-display text-3xl text-lime">{total}</div>
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

      {order.status !== 'awaiting_transfer' && !isRefunded && (
        <div data-reveal className="card p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-display">ESCROW</h2>
            <span className="text-xs text-muted">{ESCROW_LABEL[esc.state]}</span>
          </div>
          <EscrowTimeline esc={esc} />

          {canConfirm && (
            <div className="mt-2 rounded-2xl bg-cyan/5 border border-cyan/20 p-4 flex flex-col gap-3">
              <p className="text-sm">Check the account or code now. If it works, confirm delivery to release the funds to the seller. If there is a problem, report it before the window closes.</p>
              <div className="text-xs text-muted">Inspection window closes in <span className="font-medium text-cyan">{remaining !== null ? formatRemaining(remaining) : ''}</span></div>
              <button onClick={confirmRelease} className="btn self-start">CONFIRM DELIVERY &amp; RELEASE FUNDS</button>
            </div>
          )}

          {canRelease && (
            <div className="mt-2 rounded-2xl bg-lime/10 border border-lime/30 p-4 flex flex-col gap-3">
              <p className="text-sm">The 24h inspection window has closed. You can release the funds now.</p>
              <button onClick={confirmRelease} className="btn self-start">CONFIRM DELIVERY &amp; RELEASE FUNDS</button>
            </div>
          )}

          {isDisputed && (
            <div className="mt-2 rounded-2xl bg-danger/5 border border-danger/30 p-4 text-sm">
              <p className="font-medium text-danger">Funds are on hold while we mediate.</p>
              {esc.dispute?.reason && <p className="text-muted mt-1">Reason: {esc.dispute.reason}</p>}
              <a className="btn-ghost mt-3 inline-flex" href={mediationLink(CONFIG.supportWhatsapp, order.id, total)} target="_blank" rel="noreferrer">
                MEDIATE ON WHATSAPP
              </a>
            </div>
          )}

          {isReleased && <p className="mt-2 text-sm text-lime font-medium">Funds released to the seller. Thanks for buying from linksy.</p>}

          {canDispute && !disputeOpen && (
            <button onClick={() => setDisputeOpen(true)} className="mt-4 text-sm text-danger underline underline-offset-4 self-start">
              Report Issue / Dispute
            </button>
          )}

          {canDispute && disputeOpen && (
            <form onSubmit={submitDispute} className="mt-4 rounded-2xl border border-danger/30 p-4 flex flex-col gap-3">
              <label className="label" htmlFor="dispute-reason">What went wrong?</label>
              <textarea
                id="dispute-reason"
                className="input"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="E.g. login failed, code already used, wrong account"
              />
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn-danger">OPEN DISPUTE</button>
                <button type="button" onClick={() => setDisputeOpen(false)} className="btn-ghost">CANCEL</button>
              </div>
              <p className="text-xs text-muted">Opening a dispute halts fund release. Linksy will mediate with you and the seller on WhatsApp.</p>
            </form>
          )}
        </div>
      )}

      {isReleased && !reviewed && (
        <div data-reveal className="card p-6">
          <h2 className="font-display mb-3">RATE YOUR PURCHASE</h2>
          <ReviewForm onSubmit={(rating, comment) => submitReview(order.id, rating, comment)} />
        </div>
      )}
      {isReleased && reviewed && <div data-reveal className="card p-4 text-sm text-muted">Thanks, your review is saved.</div>}

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
