// Procedural key art: inline SVG, zero network bytes per cover.
// Each platform gets a gradient mesh, a geometric motif and a subtle character silhouette
// for gaming listings. Swap to a real photo any time by setting `image` on the listing.
import { memo } from 'react'

const GAME = {
  fortnite: { a: '#7c3aed', b: '#22d3ee', c: '#120a2e', m: 'hex', fig: true },
  codm: { a: '#f59e0b', b: '#84cc16', c: '#1c1917', m: 'cross', fig: true },
  pubg: { a: '#eab308', b: '#92400e', c: '#262217', m: 'crate', fig: true },
  fc: { a: '#22c55e', b: '#0f766e', c: '#052e16', m: 'ball', fig: false },
  freefire: { a: '#fb923c', b: '#dc2626', c: '#1c0a00', m: 'flame', fig: true },
  steam: { a: '#1d4ed8', b: '#38bdf8', c: '#0b1220', m: 'hex', fig: false },
  roblox: { a: '#ef4444', b: '#fb923c', c: '#1f0a0a', m: 'blocks', fig: false },
  valorant: { a: '#ef4444', b: '#fb7185', c: '#1a0508', m: 'cross', fig: true },
}
const SOCIAL = {
  instagram: { a: '#ec4899', b: '#f59e0b', c: '#2e1065', m: 'ring' },
  tiktok: { a: '#22d3ee', b: '#ec4899', c: '#0a0a0a', m: 'wave' },
  x: { a: '#94a3b8', b: '#334155', c: '#020617', m: 'lines' },
  facebook: { a: '#2563eb', b: '#60a5fa', c: '#0b1d44', m: 'ring' },
  youtube: { a: '#ef4444', b: '#fb923c', c: '#1f0303', m: 'play' },
}
const GIFT = {
  amazon: { a: '#f59e0b', b: '#fde68a', c: '#1c1305', m: 'box' },
  apple: { a: '#cbd5e1', b: '#64748b', c: '#0f172a', m: 'ring' },
  googleplay: { a: '#10b981', b: '#3b82f6', c: '#06241b', m: 'play' },
  xbox: { a: '#22c55e', b: '#a3e635', c: '#052e16', m: 'ring' },
}
const CAT = {
  gaming: { a: '#0e7c86', b: '#7c3aed', c: '#0b1d24', m: 'hex', fig: true },
  social: { a: '#ec4899', b: '#22d3ee', c: '#1e1b4b', m: 'wave', fig: false },
  giftcards: { a: '#f59e0b', b: '#0e7c86', c: '#1c1305', m: 'box', fig: false },
}

const BRAND_KEYS = [
  ['call of duty', 'codm', GAME],
  ['pubg', 'pubg', GAME],
  ['ea sports', 'fc', GAME],
  ['free fire', 'freefire', GAME],
  ['fortnite', 'fortnite', GAME],
  ['steam', 'steam', GAME],
  ['roblox', 'roblox', GAME],
  ['valorant', 'valorant', GAME],
  ['instagram', 'instagram', SOCIAL],
  ['tiktok', 'tiktok', SOCIAL],
  ['x (twitter)', 'x', SOCIAL],
  ['facebook', 'facebook', SOCIAL],
  ['youtube', 'youtube', SOCIAL],
  ['amazon', 'amazon', GIFT],
  ['apple', 'apple', GIFT],
  ['google play', 'googleplay', GIFT],
  ['xbox', 'xbox', GIFT],
]

// brand -> art key; falls back to the category palette
export function artKey(listing) {
  const b = (listing?.brand || '').toLowerCase()
  const hit = BRAND_KEYS.find(([name]) => b.includes(name))
  return hit ? hit[1] : listing?.category || 'gaming'
}

function palette(k) {
  return GAME[k] || SOCIAL[k] || GIFT[k] || CAT[k] || CAT.gaming
}

function Motif({ m, id }) {
  const stroke = { fill: 'none', stroke: '#fff' }
  switch (m) {
    case 'hex':
      return (
        <>
          <defs>
            <pattern id={`hx-${id}`} width="56" height="64" patternUnits="userSpaceOnUse">
              <path d="M28 0L56 16V48L28 64L0 48V16Z" {...stroke} strokeOpacity=".2" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="400" height="400" fill={`url(#hx-${id})`} />
        </>
      )
    case 'cross':
      return (
        <g {...stroke} strokeOpacity=".3" strokeWidth="2">
          <circle cx="200" cy="200" r="60" />
          <circle cx="200" cy="200" r="120" strokeOpacity=".18" />
          <circle cx="200" cy="200" r="180" strokeOpacity=".1" />
          <path d="M200 10V70M200 330V390M10 200H70M330 200H390" strokeOpacity=".7" strokeWidth="3" />
        </g>
      )
    case 'crate':
      return (
        <g transform="rotate(-18 200 200)" {...stroke} strokeOpacity=".28" strokeWidth="2">
          <rect x="95" y="105" width="210" height="190" rx="8" />
          <rect x="120" y="130" width="160" height="140" rx="4" strokeOpacity=".16" />
          <path d="M95 200H305M200 105V295" strokeOpacity=".2" />
        </g>
      )
    case 'ball':
      return (
        <g {...stroke} strokeOpacity=".3" strokeWidth="2">
          <circle cx="290" cy="110" r="60" />
          <polygon points="290,88 308,101 301,122 279,122 272,101" fill="#fff" fillOpacity=".15" />
          <circle cx="110" cy="300" r="40" strokeOpacity=".18" />
        </g>
      )
    case 'flame':
      return (
        <path
          d="M200 80C250 140 270 180 240 240C320 220 330 300 280 330C240 360 170 350 160 290C150 240 190 230 175 170C160 200 150 210 140 200C150 150 180 120 200 80Z"
          fill="#fff"
          fillOpacity=".18"
        />
      )
    case 'blocks':
      return (
        <>
          <defs>
            <pattern id={`bl-${id}`} width="50" height="50" patternUnits="userSpaceOnUse">
              <rect x="4" y="4" width="42" height="42" rx="6" {...stroke} strokeOpacity=".18" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="400" height="400" fill={`url(#bl-${id})`} />
        </>
      )
    case 'ring':
      return (
        <g {...stroke} strokeOpacity=".22" strokeWidth="2">
          <circle cx="200" cy="200" r="60" />
          <circle cx="200" cy="200" r="110" />
          <circle cx="200" cy="200" r="160" />
          <circle cx="200" cy="200" r="210" strokeOpacity=".1" />
        </g>
      )
    case 'wave':
      return (
        <g fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="3">
          <path d="M0 120C60 70 120 170 200 120S340 70 400 120" />
          <path d="M0 200C60 150 120 250 200 200S340 150 400 200" />
          <path d="M0 280C60 230 120 330 200 280S340 230 400 280" />
        </g>
      )
    case 'lines':
      return (
        <g stroke="#fff" strokeOpacity=".12" strokeWidth="2">
          {Array.from({ length: 14 }, (_, i) => (
            <line key={i} x1={i * 40 - 200} y1="400" x2={i * 40} y2="0" />
          ))}
        </g>
      )
    case 'box':
      return (
        <g {...stroke} strokeOpacity=".28" strokeWidth="2">
          <rect x="70" y="120" width="260" height="170" rx="22" />
          <rect x="60" y="90" width="280" height="50" rx="16" />
          <path d="M200 90V290" strokeOpacity=".5" />
        </g>
      )
    case 'play':
      return (
        <g {...stroke} strokeOpacity=".25" strokeWidth="2">
          <polygon points="160,130 280,200 160,270" fill="#fff" fillOpacity=".12" />
          <polygon points="130,90 310,200 130,310" />
        </g>
      )
    default:
      return null
  }
}

// dark silhouette of a soldier with a rifle, bottom-right, very low contrast
function Figure() {
  return (
    <g fill="#000" fillOpacity=".3">
      <circle cx="290" cy="150" r="26" />
      <path d="M240 400C240 300 252 240 290 232C328 240 340 300 340 400Z" />
      <path d="M250 300L150 268" stroke="#000" strokeOpacity=".3" strokeWidth="10" strokeLinecap="round" />
    </g>
  )
}

export const ArtSVG = memo(function ArtSVG({ k = 'gaming' }) {
  const p = palette(k)
  const id = k
  return (
    <svg className="art-svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`ga-${id}`} cx="30%" cy="28%" r="62%">
          <stop offset="0" stopColor={p.a} stopOpacity="1" />
          <stop offset="1" stopColor={p.a} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`gb-${id}`} cx="76%" cy="80%" r="60%">
          <stop offset="0" stopColor={p.b} stopOpacity="1" />
          <stop offset="1" stopColor={p.b} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`gs-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill={p.c} />
      <rect width="400" height="400" fill={`url(#ga-${id})`} />
      <rect width="400" height="400" fill={`url(#gb-${id})`} />
      <Motif m={p.m} id={id} />
      {p.fig && <Figure />}
      <rect width="400" height="400" fill={`url(#gs-${id})`} />
    </svg>
  )
})

export default ArtSVG
