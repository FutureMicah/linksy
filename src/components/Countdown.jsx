import { useEffect, useState } from 'react'

// next December 1 in the visitor's local time (this year if still ahead, otherwise next year)
function nextDec1(now) {
  let target = new Date(now.getFullYear(), 11, 1, 0, 0, 0)
  if (target <= now) target = new Date(now.getFullYear() + 1, 11, 1, 0, 0, 0)
  return target
}

function fmt(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const p = (n) => String(n).padStart(2, '0')
  return `${d}d ${p(h)}h ${p(m)}m ${p(s)}s`
}

export default function Countdown() {
  const [now, setNow] = useState(() => new Date())
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('linksy-holiday-strip-hidden') === String(new Date().getFullYear())
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (dismissed) return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [dismissed])

  if (dismissed) return null

  const target = nextDec1(now)
  const hide = () => {
    try {
      localStorage.setItem('linksy-holiday-strip-hidden', String(new Date().getFullYear()))
    } catch {
      /* private mode: still hide for this visit */
    }
    setDismissed(true)
  }

  return (
    <div role="status" aria-live="off" className="xmas-strip">
      <div className="xmas-strip-inner">
        <span>Holiday Deals Loading ✨</span>
        <span className="xmas-count">{fmt(target - now)}</span>
      </div>
      <button type="button" onClick={hide} aria-label="dismiss holiday deals banner" className="xmas-close">
        ×
      </button>
    </div>
  )
}
