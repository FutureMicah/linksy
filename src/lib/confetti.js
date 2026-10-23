// CSS-only confetti burst: 12 pieces, transform/opacity, removed after the animation.
// Fires once per browser session (sessionStorage flag). Callers check reducedMotion first.
const COLORS = ['#d9b15c', '#f6e7b8', '#84cc16', '#8a1c2b', '#ffffff']

export function burstConfetti(anchor) {
  try {
    if (sessionStorage.getItem('linksy-confetti-done')) return
    sessionStorage.setItem('linksy-confetti-done', '1')
  } catch {
    /* private mode: still fire once for this page */
  }
  if (!anchor || typeof document === 'undefined') return
  const r = anchor.getBoundingClientRect()
  const wrap = document.createElement('div')
  wrap.className = 'confetti-burst'
  wrap.setAttribute('aria-hidden', 'true')
  wrap.style.left = `${r.left + r.width / 2}px`
  wrap.style.top = `${r.top + r.height / 2}px`
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('span')
    const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.4
    const dist = 40 + Math.random() * 46
    p.style.setProperty('--cx', `${Math.cos(angle) * dist}px`)
    p.style.setProperty('--cy', `${Math.sin(angle) * dist - 26}px`)
    p.style.setProperty('--cr', `${Math.round(Math.random() * 540 - 270)}deg`)
    p.style.background = COLORS[i % COLORS.length]
    p.style.animationDelay = `${Math.round(Math.random() * 80)}ms`
    wrap.appendChild(p)
  }
  document.body.appendChild(wrap)
  setTimeout(() => wrap.remove(), 1100)
}
