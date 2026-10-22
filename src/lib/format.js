import { CONFIG } from '../config.js'

// Price stored in NGN (kobo-free integer). Display in NGN or USD.
export function formatPrice(ngn, currency = 'NGN') {
  if (currency === 'USD') {
    const usd = ngn / CONFIG.usdRate
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(usd)
  }
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(ngn)
}

export function stockLabel(listing) {
  if (listing.status === 'sold' || listing.stock <= 0) return { text: 'SOLD OUT', tone: 'danger' }
  if (listing.stock <= 2) return { text: `ONLY ${listing.stock} LEFT`, tone: 'amber' }
  return { text: `IN STOCK (${listing.stock})`, tone: 'lime' }
}

export function makeRef(prefix = 'APO') {
  const n = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-5)}${n}`
}

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
}
