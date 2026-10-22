import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SEED_LISTINGS } from '../data/seed.js'
import { makeRef, slugify } from '../lib/format.js'

// Listing status: 'active' | 'sold' | 'hidden'
// Order status: 'awaiting_transfer' | 'paid' | 'delivered' | 'cancelled'

export const useStore = create(
  persist(
    (set, get) => ({
      currency: 'NGN',
      listings: SEED_LISTINGS,
      cart: [], // [{ id, qty }]
      orders: [],

      setCurrency: (currency) => set({ currency }),

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
        set({
          listings,
          orders: get().orders.map((o) => (o.id === id ? { ...o, status } : o)),
        })
      },
    }),
    { name: 'accountplug-store-v1' },
  ),
)
