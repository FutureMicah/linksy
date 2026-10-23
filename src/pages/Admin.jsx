import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { formatPrice, stockLabel } from '../lib/format.js'
import { CATEGORIES, CONFIG } from '../config.js'
import { useReveal } from '../lib/motion.js'
import { escrowFor } from '../store/useStore.js'
import DealBadge from '../components/DealBadge.jsx'
import { ESCROW_LABEL, isInspectionOver, formatRemaining } from '../lib/escrow.js'
import { ROLE_LABEL, can, invitableRoles, inviteLink, inviteMessage, readImage, decodeInvite } from '../lib/admin.js'

const EMPTY = {
  id: '',
  title: '',
  category: 'gaming',
  brand: '',
  price_ngn: 0,
  was_ngn: 0,
  stock: 1,
  status: 'active',
  featured: false,
  cover: '🛒',
  image: '',
  description: '',
  specsText: '',
}

const ORDER_STATUSES = ['awaiting_transfer', 'paid', 'delivered', 'cancelled']

const toneText = { lime: 'text-lime-ink', amber: 'text-lime-ink', danger: 'text-danger' }

const TABS = [
  { id: 'listings', label: 'Listings', cap: 'listings.view' },
  { id: 'orders', label: 'Orders', cap: 'orders.view' },
  { id: 'reviews', label: 'Reviews', cap: 'reviews.view' },
  { id: 'users', label: 'Users', cap: 'users.view' },
  { id: 'settings', label: 'Settings', cap: 'settings.view' },
]

export default function Admin() {
  const me = useStore((s) => s.sessionUser())
  const sessionUserId = useStore((s) => s.sessionUserId)
  const logoutAdmin = useStore((s) => s.logoutAdmin)

  if (!me) return <Login />
  // owner must replace the default passcode before using the dashboard
  if (!me.passcodeHash) return <ChangePasscode />

  return <Dashboard key={sessionUserId} me={me} onLock={logoutAdmin} />
}

function Login() {
  const loginAdmin = useStore((s) => s.loginAdmin)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const res = await loginAdmin(email, pass)
    setBusy(false)
    if (!res.ok) setErr(res.error)
  }

  return (
    <form onSubmit={submit} className="card p-7 max-w-sm mx-auto mt-6 flex flex-col gap-3">
      <p className="font-display text-xs text-lime-ink tracking-[0.3em]">RESTRICTED</p>
      <h1 className="font-display text-3xl">Admin login</h1>
      <p className="text-xs text-muted">Sign in with your admin email and passcode. First time as owner? Use the default passcode, then you will set your own.</p>
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="username" />
      </div>
      <div>
        <label className="label">Passcode</label>
        <input className="input" type="password" value={pass} onChange={(e) => setPass(e.target.value)} required autoComplete="current-password" />
      </div>
      {err && <div className="text-danger text-sm">{err}</div>}
      <button className="btn" type="submit" disabled={busy}>{busy ? 'CHECKING…' : 'SIGN IN'}</button>
    </form>
  )
}

function ChangePasscode() {
  const me = useStore((s) => s.sessionUser())
  const changeOwnPasscode = useStore((s) => s.changeOwnPasscode)
  const logoutAdmin = useStore((s) => s.logoutAdmin)
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (p1 !== p2) return setErr('The two passcodes do not match.')
    const res = await changeOwnPasscode(p1)
    if (!res.ok) setErr(res.error)
  }

  return (
    <form onSubmit={submit} className="card p-7 max-w-sm mx-auto mt-6 flex flex-col gap-3">
      <p className="font-display text-xs text-lime-ink tracking-[0.3em]">SET YOUR PASSCODE</p>
      <h1 className="font-display text-3xl">Welcome, {me?.name}</h1>
      <p className="text-xs text-muted">The default passcode is public. Set your own (6+ characters) before you continue.</p>
      <div>
        <label className="label">New passcode</label>
        <input className="input" type="password" value={p1} onChange={(e) => setP1(e.target.value)} required minLength={6} autoFocus />
      </div>
      <div>
        <label className="label">Confirm passcode</label>
        <input className="input" type="password" value={p2} onChange={(e) => setP2(e.target.value)} required minLength={6} />
      </div>
      {err && <div className="text-danger text-sm">{err}</div>}
      <button className="btn" type="submit">SAVE PASSCODE</button>
      <button type="button" className="btn-ghost" onClick={logoutAdmin}>SIGN OUT</button>
    </form>
  )
}

function Dashboard({ me, onLock }) {
  const visible = TABS.filter((t) => can(me.role, t.cap))
  const [tab, setTab] = useState(visible[0]?.id || 'listings')
  const activeTab = visible.some((t) => t.id === tab) ? tab : visible[0]?.id
  const orders = useStore((s) => s.orders)
  const listings = useStore((s) => s.listings)
  const scope = useRef(null)
  useReveal(scope, [activeTab])

  const revenue = orders.filter((o) => o.status === 'paid' || o.status === 'delivered').reduce((n, o) => n + o.total_ngn, 0)
  const pending = orders.filter((o) => o.status === 'awaiting_transfer').length

  return (
    <div ref={scope} className="flex flex-col gap-6">
      <div data-reveal className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <p className="font-display text-xs text-lime-ink tracking-[0.3em]">{ROLE_LABEL[me.role].toUpperCase()} DASHBOARD</p>
          <h1 className="font-display text-4xl md:text-5xl">Admin</h1>
          <p className="text-xs text-muted mt-1">Signed in as {me.name} ({me.email})</p>
        </div>
        <button className="btn-ghost !py-2" onClick={onLock}>SIGN OUT</button>
      </div>

      {can(me.role, 'orders.view') && (
        <div data-reveal className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Active listings" value={listings.filter((l) => l.status === 'active').length} />
          <Stat label="Sold / out" value={listings.filter((l) => l.status === 'sold' || l.stock <= 0).length} />
          <Stat label="Pending transfers" value={pending} tone="amber" />
          <Stat label="Revenue (paid)" value={formatPrice(revenue, 'NGN')} tone="lime" />
        </div>
      )}

      <nav data-reveal className="flex flex-wrap gap-2 font-display text-sm" aria-label="Admin sections">
        {visible.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={activeTab === t.id ? 'btn !py-2' : 'btn-ghost !py-2'}>
            {t.label.toUpperCase()}
          </button>
        ))}
      </nav>

      {activeTab === 'listings' && <Listings me={me} />}
      {activeTab === 'orders' && <Orders me={me} />}
      {activeTab === 'reviews' && <Reviews me={me} />}
      {activeTab === 'users' && <Users me={me} />}
      {activeTab === 'settings' && <Settings me={me} />}
    </div>
  )
}

function Stat({ label, value, tone = 'olive' }) {
  const color = tone === 'lime' ? 'text-lime-ink' : tone === 'amber' ? 'text-lime-ink' : 'text-bone'
  return (
    <div className="card p-4">
      <div className="text-[11px] font-display text-muted uppercase tracking-wider">{label}</div>
      <div className={`font-display text-2xl md:text-3xl mt-1 ${color}`}>{value}</div>
    </div>
  )
}

function Listings({ me }) {
  const canEdit = can(me.role, 'listings.edit')
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
      was_ngn: Number(rest.was_ngn) || 0,
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
              className={`px-3 py-1.5 border transition-colors ${filter === f ? 'border-lime text-lime-ink shadow-[0_0_16px_-4px_rgba(217,185,122,0.6)]' : 'border-line text-muted hover:text-bone'}`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        {canEdit && <button className="btn" onClick={startNew}>+ ADD LISTING</button>}
      </div>

      {editing && canEdit && <ListingForm initial={editing} onCancel={() => setEditing(null)} onSave={save} />}

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
                  <td className="p-3"><div>{formatPrice(l.price_ngn, 'NGN')}</div><DealBadge now={l.price_ngn} was={l.was_ngn} className="mt-1" /></td>
                  <td className="p-3"><span className={toneText[st.tone]}>{st.text}</span></td>
                  <td className="p-3">
                    <div className="flex gap-1.5 justify-end flex-wrap">
                    {canEdit ? (<>
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
                      </>) : (<span className="text-[11px] text-muted">view only</span>)}
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
  const [imgErr, setImgErr] = useState('')
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
      <h2 className="font-display md:col-span-2 text-lime-ink">{isNew ? 'NEW LISTING' : 'EDIT LISTING'}</h2>
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
        <label className="label">Was price (₦, optional, shows a deal badge)</label>
        <input className="input" type="number" min="0" value={f.was_ngn || ''} onChange={set('was_ngn')} />
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
      <div className="md:col-span-2 flex flex-col gap-2">
        <label className="label">Product image (replaces the art on the card and page)</label>
        <div className="flex flex-wrap items-center gap-3">
          {f.image ? (
            <img src={f.image} alt="" className="w-20 h-20 rounded-2xl object-cover border border-line" />
          ) : (
            <div className="w-20 h-20 rounded-2xl border border-dashed border-line grid place-items-center text-xs text-muted">none</div>
          )}
          <input
            type="file"
            accept="image/*"
            className="text-xs text-muted"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              try {
                const dataUrl = await readImage(file, 800)
                setF((prev) => ({ ...prev, image: dataUrl }))
                setImgErr('')
              } catch (err) {
                setImgErr(err.message)
              }
            }}
          />
          {f.image && (
            <button type="button" className="btn-ghost !py-1.5 !px-3 !text-xs" onClick={() => setF((prev) => ({ ...prev, image: '' }))}>REMOVE IMAGE</button>
          )}
        </div>
        {imgErr && <div className="text-danger text-xs">{imgErr}</div>}
      </div>
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

function Orders({ me }) {
  const canEdit = can(me.role, 'orders.edit')
  const orders = useStore((s) => s.orders)
  const setOrderStatus = useStore((s) => s.setOrderStatus)
  const markDelivered = useStore((s) => s.markDelivered)
  const releaseFunds = useStore((s) => s.releaseFunds)
  const resolveDispute = useStore((s) => s.resolveDispute)
  const [note, setNote] = useState({})

  const escrowCount = orders.filter((o) => escrowFor(o).state === 'held' || escrowFor(o).state === 'delivered').length
  const disputeCount = orders.filter((o) => escrowFor(o).state === 'disputed').length

  if (orders.length === 0) {
    return <div className="card p-10 text-center text-muted">No orders yet. Place a test order from the shop to see it here.</div>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-lime/10 text-lime-ink px-3 py-1 font-medium">In escrow: {escrowCount}</span>
        <span className="rounded-full bg-danger/10 text-danger px-3 py-1 font-medium">Open disputes: {disputeCount}</span>
      </div>
      {orders.map((o) => {
        const esc = escrowFor(o)
        const windowOver = isInspectionOver(esc)
        return (
        <div key={o.id} className="card p-4 flex flex-col gap-2">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <div className="font-display text-lime-ink">{o.id}</div>
              <div className="text-xs text-muted">{new Date(o.created_at).toLocaleString('en-NG')}</div>
            </div>
            <div className="font-display text-lg">{formatPrice(o.total_ngn, 'NGN')}</div>
          </div>
          <div className="text-sm">{o.customer?.name} · {o.customer?.phone} · {o.customer?.email}</div>
          {o.customer?.note && <div className="text-xs text-muted">Note: {o.customer.note}</div>}
          <div className="text-sm text-muted">{o.items.map((i) => `${i.qty}× ${i.title}`).join(' · ')}</div>
          <div className="rounded-xl border border-line p-3 flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-medium">Escrow: {ESCROW_LABEL[esc.state]}</span>
              {esc.inspection_ends_at && <span className="text-muted">Window {windowOver ? 'closed' : 'open'} · ends {new Date(esc.inspection_ends_at).toLocaleString('en-NG')}</span>}
            </div>
            {esc.dispute && (
              <div className="text-danger">Dispute: {esc.dispute.reason} {esc.dispute.resolution ? `(resolved: ${esc.dispute.resolution}${esc.dispute.note ? `, ${esc.dispute.note}` : ''})` : ''}</div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {canEdit && (esc.state === 'held') && (
                <button className="btn-ghost !py-1.5 !px-3 !text-xs" onClick={() => markDelivered(o.id)}>MARK DELIVERED (START 24H)</button>
              )}
              {canEdit && esc.state === 'delivered' && (
                <button className="btn-ghost !py-1.5 !px-3 !text-xs" onClick={() => releaseFunds(o.id)}>RELEASE FUNDS NOW</button>
              )}
              {canEdit && esc.state === 'disputed' && (
                <>
                  <input
                    className="input !py-1.5 !text-xs flex-1 min-w-[160px]"
                    placeholder="Resolution note"
                    value={note[o.id] || ''}
                    onChange={(e) => setNote({ ...note, [o.id]: e.target.value })}
                  />
                  <button className="btn !py-1.5 !px-3 !text-xs" onClick={() => resolveDispute(o.id, 'release', note[o.id] || '')}>RESOLVE: RELEASE TO SELLER</button>
                  <button className="btn-danger !py-1.5 !px-3 !text-xs" onClick={() => resolveDispute(o.id, 'refund', note[o.id] || '')}>RESOLVE: REFUND BUYER</button>
                </>
              )}
            </div>
          </div>
          {canEdit && <div className="flex flex-wrap gap-1.5 mt-1 font-display text-[11px]">
            {ORDER_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setOrderStatus(o.id, s)}
                className={`px-2.5 py-1.5 border transition-colors ${o.status === s ? 'border-lime text-lime-ink' : 'border-line text-muted hover:text-bone'}`}
              >
                {s.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>}
        </div>
        )
      })}
    </div>
  )
}

function Reviews({ me }) {
  const reviews = useStore((s) => s.reviews)
  const deleteReview = useStore((s) => s.deleteReview)
  const canEdit = can(me.role, 'reviews.edit')
  if (!reviews.length) return <div className="card p-10 text-center text-muted">No reviews yet. Reviews from verified buyers appear here after delivery.</div>
  return (
    <div className="flex flex-col gap-3">
      {reviews.map((r) => (
        <div key={r.id} className="card p-4 flex flex-col gap-2">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <div className="font-display text-lime-ink">{'★'.repeat(r.rating)}<span className="text-muted">{'★'.repeat(5 - r.rating)}</span></div>
              <div className="text-xs text-muted">{r.author} · {r.order_id} · {new Date(r.created_at).toLocaleString('en-NG')}</div>
            </div>
            {canEdit && (
              <button className="btn-danger !py-1.5 !px-2 !text-xs" onClick={() => window.confirm('Delete this review?') && deleteReview(r.id)}>DELETE</button>
            )}
          </div>
          {r.comment && <p className="text-sm">{r.comment}</p>}
        </div>
      ))}
    </div>
  )
}

function Users({ me }) {
  const adminUsers = useStore((s) => s.adminUsers)
  const invites = useStore((s) => s.invites)
  const createInvite = useStore((s) => s.createInvite)
  const revokeInvite = useStore((s) => s.revokeInvite)
  const setAdminRole = useStore((s) => s.setAdminRole)
  const removeAdmin = useStore((s) => s.removeAdmin)
  const importJoin = useStore((s) => s.importJoin)
  const canInvite = can(me.role, 'users.invite')
  const isOwner = can(me.role, 'users.manage')
  const allowedRoles = invitableRoles(me.role)

  const [email, setEmail] = useState('')
  const [role, setRole] = useState(allowedRoles[allowedRoles.length - 1] || 'viewer')
  const [made, setMade] = useState(null) // { link, email, role }
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState('')
  const [joinText, setJoinText] = useState('')
  const [joinMsg, setJoinMsg] = useState('')

  const send = (e) => {
    e.preventDefault()
    setErr('')
    const res = createInvite(email, role)
    if (!res.ok) return setErr(res.error)
    const link = inviteLink(res.code)
    setMade({ link, email: email.trim().toLowerCase(), role })
    setEmail('')
  }

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      setCopied('fail')
    }
  }

  const mailto = (m) => {
    const subject = encodeURIComponent('Your Linksy admin invite')
    const body = encodeURIComponent(inviteMessage(m.link, m.role, m.email))
    return `mailto:${m.email}?subject=${subject}&body=${body}`
  }
  const whatsapp = (m) => `https://wa.me/?text=${encodeURIComponent(inviteMessage(m.link, m.role, m.email))}`

  const pending = invites.filter((i) => i.status === 'pending' && new Date(i.expires_at) > new Date())
  const past = invites.filter((i) => !(i.status === 'pending' && new Date(i.expires_at) > new Date())).slice(0, 8)

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5 flex flex-col gap-3">
        <h2 className="font-display text-lime-ink">ADMIN TEAM ({adminUsers.length})</h2>
        <div className="flex flex-col divide-y divide-line">
          {adminUsers.map((u) => (
            <div key={u.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">{u.name} {u.id === me.id && <span className="text-[11px] text-muted">(you)</span>}</div>
                <div className="text-xs text-muted">{u.email}</div>
              </div>
              <div className="flex items-center gap-2">
                {u.role === 'owner' || !isOwner ? (
                  <span className="font-display text-xs text-lime-ink">{ROLE_LABEL[u.role].toUpperCase()}</span>
                ) : (
                  <select className="input !py-1.5 !text-xs !w-auto" value={u.role} onChange={(e) => setAdminRole(u.id, e.target.value)}>
                    {['manager', 'editor', 'viewer'].map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                )}
                {isOwner && u.role !== 'owner' && (
                  <button className="btn-danger !py-1.5 !px-2 !text-xs" onClick={() => window.confirm(`Remove ${u.name} from admins?`) && removeAdmin(u.id)}>REMOVE</button>
                )}
              </div>
            </div>
          ))}
        </div>
        {!isOwner && <p className="text-xs text-muted">Only the owner can change roles or remove admins.</p>}
      </div>

      {canInvite && (
        <div className="card p-5 flex flex-col gap-4 border-lime/30">
          <div>
            <h2 className="font-display text-lime-ink">INVITE AN ADMIN</h2>
            <p className="text-xs text-muted mt-1">Creates a one-time link that expires in 7 days. The role is locked into the link.</p>
          </div>
          <form onSubmit={send} className="grid md:grid-cols-[1fr_180px_auto] gap-3 items-end">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="teammate@email.com" />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                {allowedRoles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
            <button className="btn" type="submit">CREATE INVITE</button>
          </form>
          {err && <div className="text-danger text-sm">{err}</div>}

          {made && (
            <div className="rounded-2xl border border-lime/40 p-4 flex flex-col gap-3 bg-lime/5">
              <div className="text-sm">Invite for <strong>{made.email}</strong> as <strong>{ROLE_LABEL[made.role]}</strong>. Expires in 7 days, one use.</div>
              <div className="text-xs font-mono break-all rounded-xl border border-line p-2">{made.link}</div>
              <div className="flex flex-wrap gap-2">
                <a className="btn !py-2 !text-xs" href={mailto(made)}>SEND EMAIL</a>
                <button className="btn-ghost !py-2 !text-xs" onClick={() => copy(made.link, 'link')}>{copied === 'link' ? 'COPIED' : 'COPY LINK'}</button>
                <a className="btn-ghost !py-2 !text-xs" href={whatsapp(made)} target="_blank" rel="noreferrer">SHARE ON WHATSAPP</a>
                <button className="btn-ghost !py-2 !text-xs" onClick={() => setMade(null)}>DONE</button>
              </div>
              <p className="text-[11px] text-muted">Email opens your mail app with the link filled in. Nothing is sent by this site.</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="text-xs font-display text-muted">PENDING INVITES ({pending.length})</div>
            {pending.map((i) => (
              <div key={i.nonce} className="text-xs flex flex-wrap justify-between gap-2 border-b border-line pb-2">
                <span>{i.email} · {ROLE_LABEL[i.role]} · expires {new Date(i.expires_at).toLocaleDateString('en-NG')}</span>
                <button className="text-danger" onClick={() => revokeInvite(i.nonce)}>revoke</button>
              </div>
            ))}
            {past.length > 0 && past.map((i) => (
              <div key={i.nonce} className="text-xs text-muted">{i.email} · {ROLE_LABEL[i.role]} · {i.status}</div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-line">
            <div className="text-xs font-display text-muted">ADD A JOINED ADMIN FROM THEIR JOIN CODE</div>
            <p className="text-[11px] text-muted">After someone accepts an invite, they get a join code on their screen. Paste it here so their account is on this dashboard too.</p>
            <div className="flex flex-wrap gap-2">
              <input className="input flex-1 min-w-[200px] !text-xs" value={joinText} onChange={(e) => setJoinText(e.target.value)} placeholder="Paste join code" />
              <button
                className="btn-ghost !py-2 !text-xs"
                onClick={() => {
                  const res = importJoin(joinText.trim())
                  setJoinMsg(res.ok ? `${res.user.name} added as ${ROLE_LABEL[res.user.role]}.` : res.error)
                  if (res.ok) setJoinText('')
                }}
              >
                ADD ADMIN
              </button>
            </div>
            {joinMsg && <div className="text-xs text-lime-ink">{joinMsg}</div>}
          </div>
        </div>
      )}
    </div>
  )
}

function Settings({ me }) {
  const canEdit = can(me.role, 'settings.edit')
  const settings = useStore((s) => s.siteSettings)
  const updateSettings = useStore((s) => s.updateSettings)
  const currency = useStore((s) => s.currency)
  const setCurrency = useStore((s) => s.setCurrency)
  const changeOwnPasscode = useStore((s) => s.changeOwnPasscode)
  const [logoErr, setLogoErr] = useState('')
  const [heroLines, setHeroLines] = useState(settings.heroLines.join('\n'))
  const [heroSub, setHeroSub] = useState(settings.heroSub)
  const [trust, setTrust] = useState(settings.trustItems.join('\n'))
  const [saved, setSaved] = useState('')
  const [p1, setP1] = useState('')
  const [pMsg, setPMsg] = useState('')

  const flash = (msg) => {
    setSaved(msg)
    setTimeout(() => setSaved(''), 1500)
  }
  const save = (patch, msg = 'saved') => {
    if (updateSettings(patch)) flash(msg)
  }

  const Toggle = ({ label, value, onChange, hint }) => (
    <label className="flex items-start justify-between gap-3 py-2 border-b border-line last:border-0">
      <span>
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <input type="checkbox" className="accent-lime w-5 h-5 mt-0.5" checked={!!value} disabled={!canEdit} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )

  return (
    <div className="flex flex-col gap-5">
      {!canEdit && <p className="text-xs text-muted">You can see site settings. Only the owner or a manager can change them.</p>}
      {saved && <div className="text-xs text-lime-ink">{saved}</div>}

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="font-display text-lime-ink">LOGO</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-40 h-14 rounded-xl border border-line grid place-items-center bg-white/60 overflow-hidden">
            {settings.logo ? <img src={settings.logo} alt="current logo" className="max-h-12 max-w-full object-contain" /> : <span className="text-xs text-muted">default LINKSY mark</span>}
          </div>
          {canEdit && (
            <>
              <input
                type="file"
                accept="image/*"
                className="text-xs text-muted"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file) return
                  try {
                    const { readImage: ri } = await import('../lib/admin.js')
                    const dataUrl = await ri(file, 400, 'image/png', 0.92)
                    save({ logo: dataUrl }, 'logo updated')
                    setLogoErr('')
                  } catch (err) {
                    setLogoErr(err.message)
                  }
                }}
              />
              {settings.logo && <button className="btn-ghost !py-1.5 !px-3 !text-xs" onClick={() => save({ logo: '' }, 'logo reset')}>RESET TO DEFAULT</button>}
            </>
          )}
        </div>
        {logoErr && <div className="text-danger text-xs">{logoErr}</div>}
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="font-display text-lime-ink">HERO</h2>
        <div>
          <label className="label">Headline (one line per row, up to 3)</label>
          <textarea className="input" rows={3} value={heroLines} disabled={!canEdit} onChange={(e) => setHeroLines(e.target.value)} />
        </div>
        <div>
          <label className="label">Subtext</label>
          <textarea className="input" rows={3} value={heroSub} disabled={!canEdit} onChange={(e) => setHeroSub(e.target.value)} />
        </div>
        {canEdit && (
          <button
            className="btn self-start"
            onClick={() => {
              const lines = heroLines.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 3)
              save({ heroLines: lines.length ? lines : settings.heroLines, heroSub: heroSub.trim() || settings.heroSub }, 'hero saved')
            }}
          >
            SAVE HERO
          </button>
        )}
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="font-display text-lime-ink">TRUST MARQUEE</h2>
        <div>
          <label className="label">One phrase per line</label>
          <textarea className="input" rows={4} value={trust} disabled={!canEdit} onChange={(e) => setTrust(e.target.value)} />
        </div>
        {canEdit && (
          <button
            className="btn self-start"
            onClick={() => {
              const items = trust.split('\n').map((x) => x.trim()).filter(Boolean)
              save({ trustItems: items.length ? items : settings.trustItems }, 'marquee saved')
            }}
          >
            SAVE MARQUEE
          </button>
        )}
      </section>

      <section className="card p-5 flex flex-col gap-1">
        <h2 className="font-display text-lime-ink mb-2">TOGGLES</h2>
        <Toggle label="Spider (site-wide)" hint="Turns the screen spider off for every visitor. Visitors can still hide it in the footer." value={settings.spiderEnabled} onChange={(v) => save({ spiderEnabled: v })} />
        <Toggle label="Countdown banner" hint="The holiday countdown strip at the top." value={settings.countdownOn} onChange={(v) => save({ countdownOn: v })} />
        <Toggle label="Floating art" hint="The floating art chips on every page." value={settings.floatingArtOn} onChange={(v) => save({ floatingArtOn: v })} />
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="font-display text-lime-ink">CURRENCY DISPLAY</h2>
        <div className="flex gap-2 font-display text-sm">
          {['NGN', 'USD'].map((c) => (
            <button key={c} disabled={!canEdit} onClick={() => { setCurrency(c); flash(`showing ${c}`) }} className={currency === c ? 'btn !py-2' : 'btn-ghost !py-2'}>
              {c}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">Prices are stored in naira. USD uses a rate of ₦{CONFIG.usdRate.toLocaleString('en-NG')} per dollar (VITE_USD_RATE).</p>
      </section>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="font-display text-lime-ink">MY PASSCODE</h2>
        <div className="flex flex-wrap gap-2">
          <input className="input flex-1 min-w-[180px]" type="password" minLength={6} value={p1} onChange={(e) => setP1(e.target.value)} placeholder="New passcode (6+ characters)" />
          <button
            className="btn-ghost !py-2"
            onClick={async () => {
              const res = await changeOwnPasscode(p1)
              setPMsg(res.ok ? 'passcode changed' : res.error)
              if (res.ok) setP1('')
            }}
          >
            CHANGE
          </button>
        </div>
        {pMsg && <div className="text-xs text-lime-ink">{pMsg}</div>}
      </section>
    </div>
  )
}

export function JoinScreen() {
  const [params] = useSearchParams()
  const code = params.get('code') || ''
  const redeemInvite = useStore((s) => s.redeemInvite)
  const [name, setName] = useState('')
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [err, setErr] = useState('')
  const [done, setDone] = useState(null)
  const [copied, setCopied] = useState(false)
  const info = decodeInvite(code)

  if (!info) {
    return <div className="card p-7 max-w-sm mx-auto mt-6 text-sm">This invite link is broken. Ask for a new one.</div>
  }

  const submit = async (e) => {
    e.preventDefault()
    if (pass !== pass2) return setErr('The two passcodes do not match.')
    const res = await redeemInvite(code, name, pass)
    if (!res.ok) return setErr(res.error)
    setDone(res)
  }

  if (done) {
    return (
      <div className="card p-7 max-w-sm mx-auto mt-6 flex flex-col gap-3">
        <p className="font-display text-xs text-lime-ink tracking-[0.3em]">YOU ARE IN</p>
        <h1 className="font-display text-3xl">Welcome, {done.user.name}</h1>
        <p className="text-sm">You joined as {ROLE_LABEL[done.user.role]}. Your admin tabs are ready below.</p>
        <p className="text-xs text-muted">To show up on the owner's dashboard too, send them this join code (they paste it on Users).</p>
        <div className="text-[11px] font-mono break-all rounded-xl border border-line p-2">{done.joinCode}</div>
        <button className="btn-ghost !py-2 !text-xs self-start" onClick={async () => { try { await navigator.clipboard.writeText(done.joinCode); setCopied(true) } catch { setCopied(false) } }}>
          {copied ? 'COPIED' : 'COPY JOIN CODE'}
        </button>
        <Link to="/admin" className="btn text-center">OPEN ADMIN</Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="card p-7 max-w-sm mx-auto mt-6 flex flex-col gap-3">
      <p className="font-display text-xs text-lime-ink tracking-[0.3em]">ADMIN INVITE</p>
      <h1 className="font-display text-3xl">Join the team</h1>
      <p className="text-sm">Invited as <strong>{ROLE_LABEL[info.r] || info.r}</strong> ({info.e}).</p>
      <div>
        <label className="label">Your name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </div>
      <div>
        <label className="label">Set your passcode (6+ characters)</label>
        <input className="input" type="password" value={pass} onChange={(e) => setPass(e.target.value)} required minLength={6} />
      </div>
      <div>
        <label className="label">Confirm passcode</label>
        <input className="input" type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} required minLength={6} />
      </div>
      {err && <div className="text-danger text-sm">{err}</div>}
      <button className="btn" type="submit">JOIN</button>
      <p className="text-[11px] text-muted">This link works once and expires 7 days after it was sent.</p>
    </form>
  )
}
