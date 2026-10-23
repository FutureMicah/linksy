import { useEffect, useMemo, useRef } from 'react'
import { FLOATING_ART, FLOATING_ART_COUNT } from '../data/floatingArt.js'
import { reducedMotion, finePointer, lowPower, IDLE_MS } from '../lib/motion.js'

// Decorative floating art chips. Rendered in a fixed layer at z-index -1 (under every
// page block, cards, nav and header), so they never block text or buttons.
// Each route remounts the layer (Layout keys it by pathname) and picks a fresh random
// subset + placement from src/data/floatingArt.js.
// Motion: idle drift (per-chip speed = parallax depth), scroll parallax, scroll flee,
// touch/tap/swipe startle dart with spin, desktop hover push, occasional flip dance.
// Transform/opacity only, one rAF loop, no React re-renders per frame.
// Under prefers-reduced-motion: static, faint chips, no loop, no listeners.

const SHAPE_STYLE = {
  round: { borderRadius: '1rem' },
  hex: { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
  diag: { clipPath: 'polygon(0 0, 100% 0, 100% 68%, 68% 100%, 0 100%)' },
}

const rand = (a, b) => a + Math.random() * (b - a)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const mod = (a, m) => ((a % m) + m) % m
const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3)
const SPRING_K = 40
const SPRING_C = 6

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickChips() {
  const W = typeof window !== 'undefined' ? window.innerWidth : 390
  const n = Math.min(
    FLOATING_ART.length,
    FLOATING_ART_COUNT.min + Math.floor(Math.random() * (FLOATING_ART_COUNT.max - FLOATING_ART_COUNT.min + 1)),
  )
  const picked = shuffle(FLOATING_ART).slice(0, n)
  const slots = shuffle(picked.map((_, i) => i))
  const scale = W < 480 ? 0.8 : 1
  return picked.map((a, i) => ({
    ...a,
    size: Math.round(clamp(a.size + rand(-6, 6), 44, 90) * scale),
    side: Math.random() < 0.5 ? 'l' : 'r', // edge-biased: hugs the left or right margin
    inset: rand(-6, 10), // px in from the edge (small negatives tuck slightly off-screen)
    // vertical slot spread across the page so chips sit between sections, not stacked
    yf: clamp((slots[i] + 0.5) / n * 0.9 + 0.05 + rand(-0.04, 0.04), 0.04, 0.96),
    key: `${a.src}-${i}`,
    opacity: clamp(0.5 + a.depth * 0.35, 0.5, 0.85),
  }))
}

export default function FloatingArt() {
  const layerRef = useRef(null)
  const chips = useMemo(() => pickChips(), [])
  const elsRef = useRef([])
  const states = useRef([])

  useEffect(() => {
    const still = reducedMotion() || lowPower()
    const fine = finePointer()
    const els = elsRef.current
    const W0 = window.innerWidth
    const H0 = window.innerHeight
    const dims = { W: W0, H: H0 }

    states.current = chips.map((c, i) => ({
      el: els[i],
      size: c.size,
      depth: c.depth,
      side: c.side,
      inset: c.inset,
      yf: c.yf,
      ph: rand(0, Math.PI * 2),
      sp: rand(0.12, 0.3) * (0.6 + c.depth * 0.9), // deeper chips drift faster (parallax)
      amp: rand(9, 16) * (0.5 + c.depth),
      rate: 0.03 + c.depth * 0.14, // scroll parallax rate
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      cx: 0,
      cy: 0,
      spinT0: -10,
      spinDur: 0.8,
      spinDeg: 0,
      spinAxis: 'z',
      lastStart: -10,
      nextDance: rand(4, 12),
    }))

    const sts = states.current
    let T = 0
    let raf = 0
    let last = performance.now()
    let lastActive = last
    let scrollY = window.scrollY
    let lastScrollY = scrollY
    let mouse = null

    // position + transform write for one chip
    const paint = (st, dx, dy) => {
      const { W, H } = dims
      const baseX = st.side === 'l' ? st.inset : W - st.size - st.inset
      const parY = st.yf * H - scrollY * st.rate
      const y0 = mod(parY + st.size, H + st.size) - st.size // wraps off-screen, never pops on-screen
      const X = clamp(baseX + st.x + dx, -st.size * 0.35, W - st.size * 0.65)
      const Y = y0 + st.y + dy
      st.cx = X + st.size / 2
      st.cy = Y + st.size / 2
      let rz = 0
      let ry = 0
      let s = 1
      if (T < st.spinT0 + st.spinDur) {
        const p = (T - st.spinT0) / st.spinDur
        const deg = st.spinDeg * easeOutCubic(p)
        if (st.spinAxis === 'y') ry = deg
        else rz = deg
        s = 1 + 0.08 * Math.sin(p * Math.PI)
      }
      st.el.style.transform = `translate3d(${X.toFixed(1)}px, ${Y.toFixed(1)}px, 0) rotate(${rz.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg) scale(${s.toFixed(3)})`
    }

    if (still) {
      // static faint chips, placed once
      sts.forEach((st) => {
        st.el.style.opacity = '0.35'
        paint(st, 0, 0)
      })
      const onResizeStatic = () => {
        dims.W = window.innerWidth
        dims.H = window.innerHeight
        sts.forEach((st) => paint(st, 0, 0))
      }
      window.addEventListener('resize', onResizeStatic)
      return () => window.removeEventListener('resize', onResizeStatic)
    }

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      T += dt
      sts.forEach((st) => {
        // hover: desktop cursor pushes chips away
        if (fine && mouse) {
          const ddx = st.cx - mouse.x
          const ddy = st.cy - mouse.y
          const d = Math.hypot(ddx, ddy) || 1
          const R = 130
          if (d < R) {
            const f = 900 * (1 - d / R) * (1 - d / R)
            st.vx += (ddx / d) * f * dt
            st.vy += (ddy / d) * f * dt
          }
        }
        // spring back toward rest (gives the settle after a dart / flee)
        st.vx += (-SPRING_K * st.x - SPRING_C * st.vx) * dt
        st.vy += (-SPRING_K * st.y - SPRING_C * st.vy) * dt
        st.x = clamp(st.x + st.vx * dt, -90, 90)
        st.y = clamp(st.y + st.vy * dt, -90, 90)
        // idle drift
        const dx = Math.sin(T * st.sp + st.ph) * st.amp
        const dy = Math.sin(T * st.sp * 0.7 + st.ph * 1.7) * st.amp * 0.8
        // occasional flip/dance
        if (T > st.nextDance && T > st.spinT0 + st.spinDur) {
          st.spinAxis = Math.random() < 0.5 ? 'y' : 'z'
          st.spinDeg = 360
          st.spinDur = 0.9
          st.spinT0 = T
          st.nextDance = T + rand(7, 16)
        }
        paint(st, dx, dy)
      })
      // park the loop when the tab is hidden or the page has been idle for a while
      raf = !document.hidden && now - lastActive < IDLE_MS ? requestAnimationFrame(frame) : 0
    }

    const wake = () => {
      lastActive = performance.now()
      if (!raf && !document.hidden) {
        last = lastActive
        raf = requestAnimationFrame(frame)
      }
    }
    const onVisibility = () => { if (!document.hidden) wake() }

    const onScroll = () => {
      wake()
      const ds = window.scrollY - lastScrollY
      lastScrollY = window.scrollY
      scrollY = window.scrollY
      if (Math.abs(ds) < 1) return
      // flee: impulse opposite the scroll direction, stronger for deeper chips
      sts.forEach((st) => {
        st.vy += -clamp(ds, -90, 90) * st.depth * 5
      })
    }

    const startle = (x, y, fromMove) => {
      sts.forEach((st) => {
        const ddx = st.cx - x
        const ddy = st.cy - y
        const d = Math.hypot(ddx, ddy)
        if (d > st.size / 2 + (fromMove ? 28 : 36)) return
        if (T - st.lastStart < 0.9) return
        st.lastStart = T
        const ux = d ? ddx / d : rand(-1, 1)
        const uy = d ? ddy / d : rand(-1, 1)
        const force = rand(280, 360)
        st.vx += ux * force
        st.vy += uy * force
        st.spinAxis = 'z'
        st.spinDeg = (Math.random() < 0.5 ? -1 : 1) * 540
        st.spinDur = 0.8
        st.spinT0 = T
      })
    }

    const onPointerDown = (e) => { wake(); startle(e.clientX, e.clientY, false) }
    const onPointerMove = (e) => {
      wake()
      if (e.pointerType === 'mouse') {
        mouse = { x: e.clientX, y: e.clientY }
        return
      }
      startle(e.clientX, e.clientY, true) // touch swipe passing a chip
    }
    const onLeave = () => {
      mouse = null
    }
    const onResize = () => {
      dims.W = window.innerWidth
      dims.H = window.innerHeight
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [chips])

  return (
    <div ref={layerRef} className="floating-art" aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }}>
      {chips.map((c, i) => (
        <div
          key={c.key}
          ref={(el) => (elsRef.current[i] = el)}
          className="fa-chip"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: c.size,
            height: c.size,
            opacity: c.opacity,
            willChange: 'transform',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 10px 24px -12px rgba(15,23,42,0.35)',
              background: '#f7fee7',
              ...SHAPE_STYLE[c.shape],
            }}
          >
            <img
              src={c.src}
              alt=""
              width={c.size}
              height={c.size}
              loading="lazy"
              decoding="async"
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
