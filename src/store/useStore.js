import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SEED_LISTINGS } from '../data/seed.js'
import { makeRef, slugify } from '../lib/format.js'
import { INSPECTION_MS } from '../lib/escrow.js'
import { OWNER_EMAIL, INVITE_TTL_MS, can, invitableRoles, hashPasscode, decodeInvite, encodeInvite, DEFAULT_PASSCODE } from '../lib/admin.js'

export const DEFAULT_SETTINGS = {
  logo: '', // dataURL, rendered in the header when set
  heroLines: ['Gaming', 'accounts.', 'Gift cards.'],
  heroSub: 'Socials and gift cards too. Pay the exact amount by bank transfer in naira, then get your delivery in the chat once we confirm.',
  trustItems: ['Escrow protected', 'Verified sellers', 'Bank transfer', 'Funds held until you confirm', 'Delivered in chat', '24h inspection window'],
  countdownOn: true,
  bgImage: '', // dataURL, page background behind content (admin Settings)
  spiderEnabled: true, // site-wide master for the spider (footer toggle still works per visitor)
}

const ownerSeed = () => ({ id: 'owner', name: 'Owner', email: OWNER_EMAIL, role: 'owner', passcodeHash: null, mustChangePasscode: true })

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
      spiderOn: true, // footer toggle for the screen spider (persisted)
      setSpiderOn: (v) => set({ spiderOn: !!v }),
      listings: SEED_LISTINGS,
      cart: [], // [{ id, qty }]
      orders: [],
      reviews: [], // [{ id, order_id, listing_ids, rating, comment, author, created_at }]

      setCurrency: (currency) => set({ currency }),

      // ---- admin auth, roles, invites ----
      adminUsers: [ownerSeed()], // [{ id, name, email, role, passcodeHash, mustChangePasscode }]
      sessionUserId: null, // admin session, kept in localStorage
      invites: [], // [{ nonce, email, role, created_at, expires_at, status: 'pending'|'used'|'revoked', used_by }]
      usedInviteNonces: [], // redeemed invite codes seen by this browser
      siteSettings: DEFAULT_SETTINGS,

      sessionUser: () => get().adminUsers.find((u) => u.id === get().sessionUserId) || null,
      canDo: (cap) => {
        const me = get().sessionUser()
        return !!me && can(me.role, cap)
      },

      loginAdmin: async (email, passcode) => {
        const addr = String(email || '').trim().toLowerCase()
        const user = get().adminUsers.find((u) => u.email.toLowerCase() === addr)
        if (!user) return { ok: false, error: 'No admin account with that email.' }
        let valid
        if (user.passcodeHash) valid = (await hashPasscode(user.email, passcode)) === user.passcodeHash
        else valid = passcode === DEFAULT_PASSCODE // seeded account, never changed yet
        if (!valid) return { ok: false, error: 'Wrong passcode.' }
        set({ sessionUserId: user.id })
        return { ok: true, user }
      },
      logoutAdmin: () => set({ sessionUserId: null }),

      changeOwnPasscode: async (passcode) => {
        const me = get().sessionUser()
        if (!me) return { ok: false, error: 'Log in first.' }
        if (!passcode || passcode.length < 6) return { ok: false, error: 'Use at least 6 characters.' }
        if (passcode === DEFAULT_PASSCODE) return { ok: false, error: 'Pick a passcode other than the default.' }
        const passcodeHash = await hashPasscode(me.email, passcode)
        set({
          adminUsers: get().adminUsers.map((u) => (u.id === me.id ? { ...u, passcodeHash, mustChangePasscode: false } : u)),
        })
        return { ok: true }
      },

      // Owner and manager only. Returns the code and link to share.
      createInvite: (email, role) => {
        const me = get().sessionUser()
        if (!me || !can(me.role, 'users.invite')) return { ok: false, error: 'You cannot invite admins.' }
        const addr = String(email || '').trim().toLowerCase()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) return { ok: false, error: 'Enter a valid email.' }
        if (!invitableRoles(me.role).includes(role)) return { ok: false, error: 'Your role cannot grant that role.' }
        if (get().adminUsers.some((u) => u.email.toLowerCase() === addr)) return { ok: false, error: 'That person is already an admin.' }
        const now = Date.now()
        const nonce = Math.random().toString(36).slice(2, 10) + now.toString(36)
        const expires = now + INVITE_TTL_MS
        const code = encodeInvite({ n: nonce, e: addr, r: role, x: expires })
        set({
          invites: [{ nonce, email: addr, role, created_at: new Date(now).toISOString(), expires_at: new Date(expires).toISOString(), status: 'pending', used_by: null }, ...get().invites],
        })
        return { ok: true, code }
      },

      revokeInvite: (nonce) => {
        const me = get().sessionUser()
        if (!me || !can(me.role, 'users.invite')) return false
        set({ invites: get().invites.map((i) => (i.nonce === nonce && i.status === 'pending' ? { ...i, status: 'revoked' } : i)) })
        return true
      },

      // Join screen: the code binds the role and email. Single use, 7 day expiry.
      redeemInvite: async (code, name, passcode) => {
        const p = decodeInvite(code)
        if (!p) return { ok: false, error: 'This invite link is broken.' }
        if (p.x && Date.now() > p.x) return { ok: false, error: 'This invite expired (links last 7 days).' }
        if (get().usedInviteNonces.includes(p.n) || get().invites.some((i) => i.nonce === p.n && i.status === 'used')) {
          return { ok: false, error: 'This invite was already used.' }
        }
        if (get().invites.some((i) => i.nonce === p.n && i.status === 'revoked')) return { ok: false, error: 'This invite was cancelled.' }
        const cleanName = String(name || '').trim()
        if (!cleanName) return { ok: false, error: 'Enter your name.' }
        if (!passcode || passcode.length < 6) return { ok: false, error: 'Passcode needs at least 6 characters.' }
        if (passcode === DEFAULT_PASSCODE) return { ok: false, error: 'Pick a passcode other than the default.' }
        if (get().adminUsers.some((u) => u.email.toLowerCase() === p.e)) return { ok: false, error: 'That email already has an admin account here.' }
        const id = 'adm-' + Math.random().toString(36).slice(2, 8)
        const user = { id, name: cleanName, email: p.e, role: p.r, passcodeHash: await hashPasscode(p.e, passcode), mustChangePasscode: false }
        const joinCode = encodeInvite({ id, nm: cleanName, e: p.e, r: p.r, h: user.passcodeHash, n: p.n })
        set({
          adminUsers: [...get().adminUsers, user],
          sessionUserId: id,
          usedInviteNonces: [...get().usedInviteNonces, p.n],
          invites: get().invites.map((i) => (i.nonce === p.n ? { ...i, status: 'used', used_by: id } : i)),
        })
        return { ok: true, user, joinCode }
      },

      // Owner/manager pastes the join code the new admin got back, adding them to this browser's team list.
      importJoin: (code) => {
        const me = get().sessionUser()
        if (!me || !can(me.role, 'users.invite')) return { ok: false, error: 'You cannot add admins.' }
        const p = decodeInvite(code)
        if (!p || !p.id || !p.h || !p.n) return { ok: false, error: 'That join code is not valid.' }
        if (get().adminUsers.some((u) => u.id === p.id || u.email.toLowerCase() === String(p.e).toLowerCase())) {
          return { ok: false, error: 'That admin is already on the team.' }
        }
        const invite = get().invites.find((i) => i.nonce === p.n)
        if (invite && invite.status === 'revoked') return { ok: false, error: 'That invite was cancelled.' }
        if (invite && invite.status === 'used') return { ok: false, error: 'That invite was already used.' }
        if (!invitableRoles(me.role).includes(p.r)) return { ok: false, error: 'Your role cannot add that role.' }
        const user = { id: p.id, name: p.nm, email: p.e, role: p.r, passcodeHash: p.h, mustChangePasscode: false }
        set({
          adminUsers: [...get().adminUsers, user],
          usedInviteNonces: [...get().usedInviteNonces, p.n],
          invites: get().invites.map((i) => (i.nonce === p.n ? { ...i, status: 'used', used_by: p.id } : i)),
        })
        return { ok: true, user }
      },

      // Owner only. The owner role cannot be changed or removed.
      setAdminRole: (id, role) => {
        const me = get().sessionUser()
        if (!me || !can(me.role, 'users.manage')) return false
        const target = get().adminUsers.find((u) => u.id === id)
        if (!target || target.role === 'owner' || role === 'owner' || !['manager', 'editor', 'viewer'].includes(role)) return false
        set({ adminUsers: get().adminUsers.map((u) => (u.id === id ? { ...u, role } : u)) })
        return true
      },

      removeAdmin: (id) => {
        const me = get().sessionUser()
        if (!me || !can(me.role, 'users.manage')) return false
        const target = get().adminUsers.find((u) => u.id === id)
        if (!target || target.role === 'owner') return false
        set({ adminUsers: get().adminUsers.filter((u) => u.id !== id) })
        return true
      },

      updateSettings: (patch) => {
        if (!get().canDo('settings.edit')) return false
        set({ siteSettings: { ...get().siteSettings, ...patch } })
        return true
      },

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
        if (!get().canDo('listings.edit')) return ''
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
      deleteListing: (id) => {
        if (!get().canDo('listings.edit')) return
        set({ listings: get().listings.filter((l) => l.id !== id) })
      },
      markSold: (id) => get().canDo('listings.edit') && set({
          listings: get().listings.map((l) => (l.id === id ? { ...l, status: 'sold', stock: 0 } : l)),
          cart: get().cart.filter((c) => c.id !== id),
        }),
      restock: (id, stock = 1) =>
        get().canDo('listings.edit') && set({
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
        if (!get().canDo('orders.edit')) return
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
        if (!get().canDo('orders.edit')) return false
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
        if (!get().canDo('orders.edit')) return false
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
        if (!get().canDo('orders.edit')) return false
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
      deleteReview: (id) => {
        const me = get().sessionUser()
        if (!me || !can(me.role, 'reviews.edit')) return false
        set({ reviews: get().reviews.filter((r) => r.id !== id) })
        return true
      },

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
    {
      name: 'linksy-store-v1', // keep the key so saved orders and listings survive
      version: 3,
      // merge new seed fields (e.g. product images) into previously saved listings
      migrate: (state, version) => {
        if (state?.listings?.length && version < 1) {
          state.listings = state.listings.map((l) => {
            const seed = SEED_LISTINGS.find((s) => s.id === l.id)
            return seed ? { ...l, image: seed.image } : l
          })
        }
        // v2: browsers saved before the admin team existed (or with a store missing the owner row)
        // get the owner seed back, so the default passcode login works on first visit.
        if (version < 2) {
          const list = Array.isArray(state?.adminUsers) ? state.adminUsers : []
          const hasOwner = list.some((u) => String(u.email || '').trim().toLowerCase() === OWNER_EMAIL)
          state.adminUsers = hasOwner ? list : [ownerSeed(), ...list]
          if (!state.siteSettings) state.siteSettings = DEFAULT_SETTINGS
        }
        // v3: browsers saved before newer settings keys (spiderEnabled, bgImage) existed
        // kept an old siteSettings object that lacked them; merge defaults so every key is defined.
        if (version < 3) {
          state.siteSettings = { ...DEFAULT_SETTINGS, ...(state.siteSettings || {}) }
          delete state.siteSettings.floatingArtOn
        }
        return state
      },
    },
  ),
)
