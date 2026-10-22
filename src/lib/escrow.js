// Escrow model. Linksy holds the buyer's payment until delivery is confirmed.
// Escrow states: 'pending' | 'held' | 'delivered' | 'released' | 'disputed' | 'refunded'

export const INSPECTION_MS = 24 * 60 * 60 * 1000

export const ESCROW_LABEL = {
  pending: 'Awaiting payment',
  held: 'Held in escrow by Linksy',
  delivered: 'Delivered, inspection window open',
  released: 'Released to seller',
  disputed: 'Disputed, funds on hold',
  refunded: 'Refunded to buyer',
}

export function inspectionEndsAt(esc) {
  if (!esc.inspection_ends_at) return null
  return new Date(esc.inspection_ends_at).getTime()
}

export function isInspectionOver(esc, now = Date.now()) {
  const ends = inspectionEndsAt(esc)
  return ends === null || now >= ends
}

export function formatRemaining(ms) {
  if (ms <= 0) return '00:00:00'
  const s = Math.floor(ms / 1000)
  const h = String(Math.floor(s / 3600)).padStart(2, '0')
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return `${h}:${m}:${sec}`
}

// Shared WhatsApp mediation link for disputes.
export function mediationLink(whatsapp, orderId, total) {
  const text = `Hi linksy, I want to report an issue on order ${orderId}${total ? ` (${total})` : ''}. Please mediate. The funds are on hold in escrow.`
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`
}
