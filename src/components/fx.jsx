// Scroll / touch / pointer / crawl effects. Transform and opacity only.
// Every effect respects prefers-reduced-motion and gates hover-only work on fine pointers.
import { useEffect, useRef } from 'react'
import { reducedMotion, finePointer } from '../lib/motion.js'

// letters crawl in one by one (IntersectionObserver via the parent data-io="letters")
export function CrawlText({ text, className = '', stagger = 26 }) {
  return (
    <span className={`crawl-text ${className}`} data-io="letters" aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span key={i} aria-hidden="true" data-letter style={{ transitionDelay: `${i * stagger}ms` }}>
          {ch === ' ' ? '\u00a0' : ch}
        </span>
      ))}
    </span>
  )
}

// thin top bar that fills with scroll position (transform only)
export function ScrollProgress() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const upd = () => {
      raf = 0
      const h = document.documentElement.scrollHeight - window.innerHeight
      el.style.transform = `scaleX(${h > 0 ? Math.min(1, window.scrollY / h) : 0})`
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(upd)
    }
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    upd()
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
      cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="scroll-progress pointer-events-none fixed inset-x-0 top-0 h-[3px] z-[60]"
      style={{ background: 'var(--grad-stream)', transform: 'scaleX(0)' }}
    />
  )
}

// soft glow that trails the cursor (fine pointers only, never under reduced motion). rAF lerp, no library.
export function CursorGlow() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion() || !finePointer()) return undefined
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0
    const tick = () => {
      x += (tx - x) * 0.14
      y += (ty - y) * 0.14
      el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : 0
    }
    const move = (e) => {
      tx = e.clientX
      ty = e.clientY
      el.style.opacity = '1'
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const leave = () => (el.style.opacity = '0')
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
      cancelAnimationFrame(raf)
    }
  }, [])
  return <div ref={ref} aria-hidden="true" className="cursor-glow fixed left-0 top-0 pointer-events-none" style={{ opacity: 0 }} />
}

const IO_STAGGER_CAP = 8 // max 8 steps: 75ms x 8 = 600ms worst case

// data-io reveal: "fade" | "slide" | "crawl" | "line" (underline draws in), stagger via data-io-stagger (ms per sibling)
// data-drift="0.1": element shifts vertically at a depth proportional to its distance from screen centre
// data-head: header scales and fades as it leaves the centre of the screen
export function useScrollFx(rootRef, key) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const rm = reducedMotion()
    let items = []
    let raf = 0

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('io-in')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.1 },
    )

    const update = () => {
      raf = 0
      if (rm) return
      const vh = window.innerHeight
      for (const el of items) {
        const r = el.getBoundingClientRect()
        if (r.bottom < -vh * 0.3 || r.top > vh * 1.3) continue
        const cur = el._y || 0
        const top = r.top - cur
        const c = (top + r.height / 2 - vh / 2) / vh
        if (el.hasAttribute('data-drift')) {
          el._y = -c * Number(el.dataset.drift) * 100
          el.style.transform = `translate3d(0,${el._y.toFixed(1)}px,0)`
        }
        if (el.hasAttribute('data-head')) {
          const a = Math.min(1, Math.abs(c))
          el.style.opacity = (1 - a * 0.5).toFixed(3)
          el.style.transform = `scale(${(1 - a * 0.05).toFixed(3)})`
        }
      }
    }

    const onScroll = () => {
      if (!raf && !rm) raf = requestAnimationFrame(update)
    }

    const scan = () => {
      root.querySelectorAll('[data-io]:not([data-io-on])').forEach((el) => {
        el.dataset.ioOn = '1'
        const st = Number(el.dataset.ioStagger || 0)
        if (st && el.parentElement) {
          // cap the index so long grids never make the last cards wait more than IO_STAGGER_CAP * st ms
          const i = Math.min(Array.prototype.indexOf.call(el.parentElement.children, el), IO_STAGGER_CAP)
          el.style.setProperty('--io-d', `${i * st}ms`)
        }
        if (rm) el.classList.add('io-in')
        else io.observe(el)
      })
      items = Array.from(root.querySelectorAll('[data-drift],[data-head]'))
      onScroll()
    }

    scan()
    const mo = new MutationObserver(scan)
    mo.observe(root, { childList: true, subtree: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      io.disconnect()
      mo.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [rootRef, key])
}

// tap ripple + haptic-feeling press (delegated; works for mouse and touch)
export function useRipple() {
  useEffect(() => {
    if (reducedMotion()) return
    const onDown = (e) => {
      const host = e.target?.closest?.('.btn,.btn-ghost,[data-ripple]')
      if (!host) return
      if (e.pointerType === 'touch' && navigator.vibrate) navigator.vibrate(8)
      const r = host.getBoundingClientRect()
      const size = Math.max(r.width, r.height) * 2
      const s = document.createElement('span')
      s.className = 'ripple'
      s.style.width = s.style.height = `${size}px`
      s.style.left = `${e.clientX - r.left - size / 2}px`
      s.style.top = `${e.clientY - r.top - size / 2}px`
      host.appendChild(s)
      s.addEventListener('animationend', () => s.remove())
    }
    document.addEventListener('pointerdown', onDown, { passive: true })
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])
}

// drag-to-explore with momentum for mouse users (touch keeps native swipe)
export function useDragScroll(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion() || !finePointer()) return
    el.classList.add('drag-row')
    let down = false
    let moved = false
    let startX = 0
    let startLeft = 0
    let lastX = 0
    let lastT = 0
    let v = 0
    let raf = 0
    let snap = ''
    const cancelMomentum = () => cancelAnimationFrame(raf)

    const onDown = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      cancelMomentum()
      down = true
      moved = false
      startX = lastX = e.clientX
      startLeft = el.scrollLeft
      lastT = performance.now()
      v = 0
      snap = el.style.scrollSnapType
      el.style.scrollSnapType = 'none'
      el.classList.add('is-dragging')
    }
    const onMove = (e) => {
      if (!down) return
      const dx = e.clientX - startX
      if (Math.abs(dx) > 5) moved = true
      el.scrollLeft = startLeft - dx
      const now = performance.now()
      const dt = now - lastT
      if (dt > 0) v = (e.clientX - lastX) / dt
      lastX = e.clientX
      lastT = now
    }
    const end = () => {
      if (!down) return
      down = false
      el.classList.remove('is-dragging')
      let vel = -v * 16
      const step = () => {
        el.scrollLeft += vel
        vel *= 0.93
        if (Math.abs(vel) > 0.5) raf = requestAnimationFrame(step)
        else el.style.scrollSnapType = snap
      }
      if (Math.abs(vel) > 0.5) raf = requestAnimationFrame(step)
      else el.style.scrollSnapType = snap
    }
    // a drag should not also count as a click on a card
    const onClick = (e) => {
      if (moved) {
        e.preventDefault()
        e.stopPropagation()
        moved = false
      }
    }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', end)
    el.addEventListener('click', onClick, true)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', end)
      el.removeEventListener('click', onClick, true)
      cancelMomentum()
    }
  }, [ref])
}

// Scroll-reactive layer, one rAF loop, transform only:
// - .aurora drifts with scroll speed (translate3d on the container, blobs keep their own CSS drift)
// - .tile-wrap nudges sideways a few px toward the scroll direction (uses the `translate` property, so hover/tilt transforms are untouched)
// - [data-cparallax] images counter-move against their card as it crosses the viewport
// - [data-wstagger] headers get a word-by-word rise on enter (IntersectionObserver)
// Respects reduced motion (static: nothing runs).
export function useScrollReactive(rootRef, key) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion()) return undefined
    let raf = 0
    let lastY = window.scrollY
    let lastT = performance.now()
    let vel = 0 // smoothed px/ms
    let dir = 0 // -1 up, 1 down

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('wstag-in')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.2 },
    )

    const update = () => {
      raf = 0
      if (rm) return
      const vh = window.innerHeight
      for (const el of items) {
        const r = el.getBoundingClientRect()
        if (r.bottom < -vh * 0.3 || r.top > vh * 1.3) continue
        const cur = el._y || 0
        const top = r.top - cur
        const c = (top + r.height / 2 - vh / 2) / vh
        if (el.hasAttribute('data-drift')) {
          el._y = -c * Number(el.dataset.drift) * 100
          el.style.transform = `translate3d(0,${el._y.toFixed(1)}px,0)`
        }
        if (el.hasAttribute('data-head')) {
          const a = Math.min(1, Math.abs(c))
          el.style.opacity = (1 - a * 0.5).toFixed(3)
          el.style.transform = `scale(${(1 - a * 0.05).toFixed(3)})`
        }
      }
    }

    const onScroll = () => {
      if (!raf && !rm) raf = requestAnimationFrame(update)
    }

    const scan = () => {
      root.querySelectorAll('[data-io]:not([data-io-on])').forEach((el) => {
        el.dataset.ioOn = '1'
        const st = Number(el.dataset.ioStagger || 0)
        if (st && el.parentElement) {
          // cap the index so long grids never make the last cards wait more than IO_STAGGER_CAP * st ms
          const i = Math.min(Array.prototype.indexOf.call(el.parentElement.children, el), IO_STAGGER_CAP)
          el.style.setProperty('--io-d', `${i * st}ms`)
        }
        if (rm) el.classList.add('io-in')
        else io.observe(el)
      })
      items = Array.from(root.querySelectorAll('[data-drift],[data-head]'))
      onScroll()
    }

    scan()
    const mo = new MutationObserver(scan)
    mo.observe(root, { childList: true, subtree: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      io.disconnect()
      mo.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [rootRef, key])
}

// tap ripple + haptic-feeling press (delegated; works for mouse and touch)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

// Words rise one by one when the header enters the viewport (see .wstag in fx.css)
export function WordStagger({ text, className = '', as: Tag = 'h2', ...rest }) {
  const words = text.split(' ')
  return (
    <Tag className={`wstag ${className}`} data-wstagger aria-label={text} {...rest}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true" className="wstag-w" style={{ transitionDelay: `${Math.min(i, 8) * 70}ms` }}>
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  )
}
