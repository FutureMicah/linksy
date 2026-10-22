import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SEED_LISTINGS } from '../data/seed.js'
import { makeRef, slugify } from '../lib/format.js'
import { INSPECTION_MS } from '../lib/escrow.js'

// Listing status: 'active' | 'sold' | 'hidden'
// Order status: 'awaiting_transfer' | 'paid' | 'delivered' | 'cancelled'

// Orders saved before escrow existed fall back to a status-derived escrow record.
export function escrowFor(order) {
  if (order.escrow) return order.escrow
  const map = { awaiting_transfer: 'pending', paid: 'held', delivered: 'delivered', cancelled: 'refunded' }
  return { state: map[order.status] || 'pending', held_at: null, delivered_at: null, inspection_ends_at: null, released_at: null, dispute: null }
}

export const useStore = create(
  persist(
    (set, get) => ({
      currency: 'NGN',
      spiderOn: true,
      listings: SEED_LISTINGS,
      cart: [], // [{ id, qty }]
      orders: [],
      reviews: [], // [{ id, order_id, listing_ids, rating, comment, author, created_at }]

      setCurrency: (currency) => set({ currency }),
      setSpiderOn: (spiderOn) => set({ spiderOn }),

      // ---- cart ----
      addToCart: (id) => {
        const listing = get().listings.find((l) => l.id === id)
        if (!listing || listing.status !== 'active' || listing.stock <= 0) return false
        const existing = get().cart.find((c) => c.id === id)
        if (existing) {
          if (existing.qty >= listing.stock) return false
          set({ cart: get().cart.map((c) => (c.id === id ? { ...c, qty: c.qty + 1 } : c)) })
        } else {
          set({ cart: [...get().cart, { id, qty: 1 }] })
        }
        return true
      },
      setQty: (id, qty) => {
        const listing = get().listings.find((l) => l.id === id)
        const max = listing ? listing.stock : 1
        const q = Math.max(0, Math.min(qty, max))
        set({
          cart: q === 0 ? get().cart.filter((c) => c.id !== id) : get().cart.map((c) => (c.id === id ? { ...c, qty: q } : c)),
        })
      },
      removeFromCart: (id) => set({ cart: get().cart.filter((c) => c.id !== id) }),
      clearCart: () => set({ cart: [] }),

      // ---- listings (admin) ----
      upsertListing: (data) => {
        const { listings } = get()
        if (data.id && listings.some((l) => l.id === data.id)) {
          set({ listings: listings.map((l) => (l.id === data.id ? { ...l, ...data } : l)) })
          return data.id
        }
        const id = `${data.category?.slice(0, 2) || 'xx'}-${Date.now().toString(36)}`
        const item = {
          featured: false,
          cover: '🛒',
          status: 'active',
          specs: {},
          ...data,
          id,
          slug: slugify(data.title) + '-' + id.slice(-4),
          created_at: new Date().toISOString(),
        }
        set({ listings: [item, ...listings] })
        return id
      },
      deleteListing: (id) => set({ listings: get().listings.filter((l) => l.id !== id) }),
      markSold: (id) =>
        set({
          listings: get().listings.map((l) => (l.id === id ? { ...l, status: 'sold', stock: 0 } : l)),
          cart: get().cart.filter((c) => c.id !== id),
        }),
      restock: (id, stock = 1) =>
        set({
          listings: get().listings.map((l) => (l.id === id ? { ...l, status: 'active', stock } : l)),
        }),

      // ---- orders ----
      placeOrder: (customer) => {
        const { cart, listings, orders } = get()
        if (!cart.length) return null
        const items = cart.map((c) => {
          const l = listings.find((x) => x.id === c.id)
          return { id: l.id, title: l.title, category: l.category, qty: c.qty, unit_ngn: l.price_ngn }
        })
        const total_ngn = items.reduce((s, i) => s + i.qty * i.unit_ngn, 0)
        // Reserve stock now so two buyers cannot take the same account.
        const next = listings.map((l) => {
          const line = cart.find((c) => c.id === l.id)
          if (!line) return l
          const stock = Math.max(0, l.stock - line.qty)
          return { ...l, stock, status: stock === 0 ? 'sold' : l.status }
        })
        const order = {
          id: makeRef(),
          items,
          total_ngn,
          customer,
          status: 'awaiting_transfer',
          escrow: { state: 'pending', held_at: null, delivered_at: null, inspection_ends_at: null, released_at: null, dispute: null },
          created_at: new Date().toISOString(),
        }
        set({ listings: next, orders: [order, ...orders], cart: [] })
        return order
      },
      setOrderStatus: (id, status) => {
        const order = get().orders.find((o) => o.id === id)
        if (!order) return
        let listings = get().listings
        // Cancelling returns reserved stock to the listings.
        if (status === 'cancelled' && order.status !== 'cancelled') {
          listings = listings.map((l) => {
            const line = order.items.find((i) => i.id === l.id)
            if (!line) return l
            const stock = l.stock + line.qty
            return { ...l, stock, status: l.status === 'sold' && stock > 0 ? 'active' : l.status }
          })
        }
        const esc = { ...escrowFor(order) }
        // Admin marks payment verified: money is now held by Linksy.
        if (status === 'paid' && esc.state === 'pending') {
          esc.state = 'held'
          esc.held_at = new Date().toISOString()
        }
        if (status === 'cancelled' && esc.state !== 'released') {
          esc.state = 'refunded'
        }
        set({
          listings,
          orders: get().orders.map((o) => (o.id === id ? { ...o, status, escrow: esc } : o)),
        })
      },

      // ---- escrow ----
      // Seller/admin hands over the account or code. Starts the 24h inspection window.
      markDelivered: (id) => {
        const order = get().orders.find((o) => o.id === id)
        if (!order) return false
        const esc = escrowFor(order)
        if (esc.state !== 'held' && esc.state !== 'delivered') return false
        const now = Date.now()
        const next = {
          ...esc,
          state: 'delivered',
          delivered_at: esc.delivered_at || new Date(now).toISOString(),
          inspection_ends_at: esc.inspection_ends_at || new Date(now + INSPECTION_MS).toISOString(),
        }
        set({ orders: get().orders.map((o) => (o.id === id ? { ...o, status: 'delivered', escrow: next } : o)) })
        return true
      },

      // Buyer confirms delivery, or admin releases. Blocked while a dispute is open.
      releaseFunds: (id) => {
        const order = get().orders.find((o) => o.id === id)
        if (!order) return false
        const esc = escrowFor(order)
        // Only a delivered order can be released. Disputes, refunds and pre-payment states are blocked.
        if (esc.state !== 'delivered') return false
        const next = { ...esc, state: 'released', released_at: new Date().toISOString() }
        set({ orders: get().orders.map((o) => (o.id === id ? { ...o, status: 'delivered', escrow: next } : o)) })
        return true
      },

      // Buyer hits "Report Issue". Halts release until an admin resolves it.
      openDispute: (id, reason) => {
        const order = get().orders.find((o) => o.id === id)
        if (!order) return false
        const esc = escrowFor(order)
        if (esc.state !== 'held' && esc.state !== 'delivered') return false
        const next = {
          ...esc,
          state: 'disputed',
          dispute: { reason: reason || 'Buyer reported an issue', opened_at: new Date().toISOString(), prev_state: esc.state, resolution: null },
        }
        set({ orders: get().orders.map((o) => (o.id === id ? { ...o, escrow: next } : o)) })
        return true
      },

      // Admin resolves a dispute: release funds to the seller, or refund the buyer.
      resolveDispute: (id, outcome, note = '') => {
        const order = get().orders.find((o) => o.id === id)
        if (!order) return false
        const esc = escrowFor(order)
        if (esc.state !== 'disputed') return false
        const resolvedAt = new Date().toISOString()
        const dispute = { ...esc.dispute, resolution: outcome, note, resolved_at: resolvedAt }
        if (outcome === 'release') {
          const next = { ...esc, state: 'released', released_at: resolvedAt, dispute }
          set({ orders: get().orders.map((o) => (o.id === id ? { ...o, status: 'delivered', escrow: next } : o)) })
          return true
        }
        // refund: same stock return as cancelling
        get().setOrderStatus(id, 'cancelled')
        set({
          orders: get().orders.map((o) =>
            o.id === id ? { ...o, escrow: { ...escrowFor(o), state: 'refunded', dispute } } : o,
          ),
        })
        return true
      },

      // ---- reviews ----
      submitReview: (orderId, rating, comment) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return false
        if (get().reviews.some((r) => r.order_id === orderId)) return false
        const r = Math.max(1, Math.min(5, Math.round(rating)))
        const review = {
          id: makeRef('REV'),
          order_id: orderId,
          listing_ids: order.items.map((i) => i.id),
          rating: r,
          comment: comment.trim(),
          author: order.customer?.name || 'Verified buyer',
          created_at: new Date().toISOString(),
        }
        set({ reviews: [review, ...get().reviews] })
        return true
      },
    }),
    { name: 'linksy-store-v1' },
  ),
)
