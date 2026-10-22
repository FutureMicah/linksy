import { useMemo, useRef, useState } from 'react'
import { useStore } from '../store/useStore.js'
import { formatPrice, stockLabel } from '../lib/format.js'
import { CATEGORIES, CONFIG } from '../config.js'
import { useReveal } from '../lib/motion.js'

const SESSION_KEY = 'accountplug-admin-ok'

const EMPTY = {
  id: '',
  title: '',
  category: 'gaming',
  brand: '',
  price_ngn: 0,
  stock: 1,
  status: 'active',
  featured: false,
  cover: '🛒',
  description: '',
  specsText: '',
}

const ORDER_STATUSES = ['awaiting_transfer', 'paid', 'delivered', 'cancelled']

const toneText = { lime: 'text-lime', amber: 'text-amber', danger: 'text-danger' }

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')

  const login = (e) => {
    e.preventDefault()
    if (pin === CONFIG.adminPin) {
      sessionStorage.setItem(SESSION_KEY, '1')
      setAuthed(true)
    } else {
      setPinError('Wrong PIN.')
    }
  }

  if (!authed) {
    return (
      <form onSubmit={login} className="card p-7 max-w-sm mx-auto mt-6 flex flex-col gap-3">
        <p className="font-display text-xs text-amber tracking-[0.3em]">RESTRICTED</p>
        <h1 className="font-display text-3xl">Owner access</h1>
        <p className="text-xs text-muted">Enter the admin PIN from your .env.local (VITE_ADMIN_PIN).</p>
        <input className="input" type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Admin PIN" autoFocus />
        {pinError && <div className="text-danger text-sm">{pinError}</div>}
        <button className="btn" type="submit">UNLOCK</button>
      </form>
    )
  }

  return (
    <Dashboard
      onLock={() => {
        sessionStorage.removeItem(SESSION_KEY)
        setAuthed(false)
      }}
    />
  )
}

function Dashboard({ onLock }) {
  const [tab, setTab] = useState('listings')
  const orders = useStore((s) => s.orders)
  const listings = useStore((s) => s.listings)
  const scope = useRef(null)
  useReveal(scope, [tab])

  const revenue = orders.filter((o) => o.status === 'paid' || o.status === 'delivered').reduce((n, o) => n + o.total_ngn, 0)
  const pending = orders.filter((o) => o.status === 'awaiting_transfer').length

  return (
    <div ref={scope} className="flex flex-col gap-6">
      <div data-reveal className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <p className="font-display text-xs text-amber tracking-[0.3em]">OWNER DASHBOARD</p>
          <h1 className="font-display text-4xl md:text-5xl">Admin</h1>
        </div>
        <button className="btn-ghost !py-2" onClick={onLock}>LOCK</button>
      </div>

      <div data-reveal className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Active listings" value={listings.filter((l) => l.status === 'active').length} />
        <Stat label="Sold / out" value={listings.filter((l) => l.status === 'sold' || l.stock <= 0).length} />
        <Stat label="Pending transfers" value={pending} tone="amber" />
        <Stat label="Revenue (paid)" value={formatPrice(revenue, 'NGN')} tone="lime" />
      </div>

      <div data-reveal className="flex gap-2 font-display text-sm">
        {['listings', 'orders'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? 'btn !py-2' : 'btn-ghost !py-2'}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'listings' ? <Listings /> : <Orders />}
    </div>
  )
}

function Stat({ label, value, tone = 'olive' }) {
  const color = tone === 'lime' ? 'text-lime' : tone === 'amber' ? 'text-amber' : 'text-bone'
  return (
    <div className="card p-4">
      <div className="text-[11px] font-display text-muted uppercase tracking-wider">{label}</div>
      <div className={`font-display text-2xl md:text-3xl mt-1 ${color}`}>{value}</div>
    </div>
  )
}

function Listings() {
  const listings = useStore((s) => s.listings)
  const upsertListing = useStore((s) => s.upsertListing)
  const deleteListing = useStore((s) => s.deleteListing)
  const markSold = useStore((s) => s.markSold)
  const restock = useStore((s) => s.restock)
  const [editing, setEditing] = useState(null) // null | form object
  const [filter, setFilter] = useState('all')

  const shown = useMemo(
    () => (filter === 'all' ? listings : listings.filter((l) => l.category === filter || l.status === filter)),
    [listings, filter],
  )

  const startNew = () => setEditing({ ...EMPTY })
  const startEdit = (l) =>
    setEditing({
      ...l,
      specsText: Object.entries(l.specs || {}).map(([k, v]) => `${k}: ${v}`).join('\n'),
    })

  const save = (form) => {
    const specs = {}
    form.specsText.split('\n').forEach((line) => {
      const idx = line.indexOf(':')
      if (idx > 0) specs[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
    })
    const { specsText, ...rest } = form
    upsertListing({
      ...rest,
      specs,
      price_ngn: Number(rest.price_ngn) || 0,
      stock: Math.max(0, Number(rest.stock) || 0),
    })
    setEditing(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1.5 font-display text-xs">
          {['all', ...CATEGORIES.map((c) => c.id), 'sold'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 border transition-colors ${filter === f ? 'border-lime text-lime shadow-[0_0_16px_-4px_rgba(217,185,122,0.6)]' : 'border-line text-muted hover:text-bone'}`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <button className="btn" onClick={startNew}>+ ADD LISTING</button>
      </div>

      {editing && <ListingForm initial={editing} onCancel={() => setEditing(null)} onSave={save} />}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="font-display text-[11px] text-muted text-left border-b border-line">
            <tr>
              <th className="p-3">Listing</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((l) => {
              const st = stockLabel(l)
              return (
                <tr key={l.id} className="border-b border-line last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="p-3">
                    <div className="font-semibold">{l.title}</div>
                    <div className="text-[11px] text-muted">{l.id}</div>
                  </td>
                  <td className="p-3 capitalize">{l.category}</td>
                  <td className="p-3">{formatPrice(l.price_ngn, 'NGN')}</td>
                  <td className="p-3"><span className={toneText[st.tone]}>{st.text}</span></td>
                  <td className="p-3">
                    <div className="flex gap-1.5 justify-end flex-wrap">
                      <button className="btn-ghost !py-1.5 !px-2 !text-xs" onClick={() => startEdit(l)}>EDIT</button>
                      {l.status !== 'sold' && l.stock > 0 ? (
                        <button className="btn-ghost !py-1.5 !px-2 !text-xs" onClick={() => markSold(l.id)}>MARK SOLD</button>
                      ) : (
                        <button className="btn-ghost !py-1.5 !px-2 !text-xs" onClick={() => restock(l.id, 1)}>RESTOCK</button>
                      )}
                      <button
                        className="btn-danger !py-1.5 !px-2"
                        onClick={() => window.confirm(`Delete "${l.title}"? This cannot be undone.`) && deleteListing(l.id)}
                      >
                        DELETE
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">Changes save to this browser (localStorage). Connect Supabase to share them across devices (see README).</p>
    </div>
  )
}

function ListingForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const isNew = !initial.id

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!f.title.trim()) return
        onSave(f)
      }}
      className="card p-5 grid md:grid-cols-2 gap-3 border-lime/30"
    >
      <h2 className="font-display md:col-span-2 text-lime">{isNew ? 'NEW LISTING' : 'EDIT LISTING'}</h2>
      <div>
        <label className="label">Title</label>
        <input className="input" value={f.title} onChange={set('title')} required />
      </div>
      <div>
        <label className="label">Brand / platform</label>
        <input className="input" value={f.brand} onChange={set('brand')} />
      </div>
      <div>
        <label className="label">Category</label>
        <select className="input" value={f.category} onChange={set('category')}>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Price (₦)</label>
        <input className="input" type="number" min="0" value={f.price_ngn} onChange={set('price_ngn')} />
      </div>
      <div>
        <label className="label">Stock</label>
        <input className="input" type="number" min="0" value={f.stock} onChange={set('stock')} />
      </div>
      <div>
        <label className="label">Status</label>
        <select className="input" value={f.status} onChange={set('status')}>
          <option value="active">active</option>
          <option value="hidden">hidden</option>
          <option value="sold">sold</option>
        </select>
      </div>
      <div>
        <label className="label">Icon (emoji)</label>
        <input className="input" value={f.cover} onChange={set('cover')} maxLength={4} />
      </div>
      <label className="flex items-center gap-2 text-sm mt-5">
        <input type="checkbox" className="accent-lime" checked={!!f.featured} onChange={set('featured')} /> Featured
      </label>
      <div className="md:col-span-2">
        <label className="label">Description</label>
        <textarea className="input" rows={3} value={f.description} onChange={set('description')} />
      </div>
      <div className="md:col-span-2">
        <label className="label">Specs (one per line, "Key: value")</label>
        <textarea className="input font-mono text-xs" rows={4} value={f.specsText} onChange={set('specsText')} />
      </div>
      <div className="md:col-span-2 flex gap-2 justify-end">
        <button type="button" className="btn-ghost" onClick={onCancel}>CANCEL</button>
        <button type="submit" className="btn">SAVE</button>
      </div>
    </form>
  )
}

function Orders() {
  const orders = useStore((s) => s.orders)
  const setOrderStatus = useStore((s) => s.setOrderStatus)

  if (orders.length === 0) {
    return <div className="card p-10 text-center text-muted">No orders yet. Place a test order from the shop to see it here.</div>
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((o) => (
        <div key={o.id} className="card p-4 flex flex-col gap-2">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <div className="font-display text-lime">{o.id}</div>
              <div className="text-xs text-muted">{new Date(o.created_at).toLocaleString('en-NG')}</div>
            </div>
            <div className="font-display text-lg">{formatPrice(o.total_ngn, 'NGN')}</div>
          </div>
          <div className="text-sm">{o.customer?.name} · {o.customer?.phone} · {o.customer?.email}</div>
          {o.customer?.note && <div className="text-xs text-muted">Note: {o.customer.note}</div>}
          <div className="text-sm text-muted">{o.items.map((i) => `${i.qty}× ${i.title}`).join(' · ')}</div>
          <div className="flex flex-wrap gap-1.5 mt-1 font-display text-[11px]">
            {ORDER_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setOrderStatus(o.id, s)}
                className={`px-2.5 py-1.5 border transition-colors ${o.status === s ? 'border-lime text-lime' : 'border-line text-muted hover:text-bone'}`}
              >
                {s.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
