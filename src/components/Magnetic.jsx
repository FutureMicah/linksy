import { useEffect, useRef } from 'react'
import { finePointer, reducedMotion } from '../lib/motion.js'

// Wrapper that pulls its child toward the cursor (fine pointers only). Plain rAF lerp, no animation library.
export default function Magnetic({ children, strength = 0.32, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion() || !finePointer()) return undefined
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0
    const tick = () => {
      x += (tx - x) * 0.18
      y += (ty - y) * 0.18
      el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.1 ? requestAnimationFrame(tick) : 0
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick) }
    const move = (e) => {
      const r = el.getBoundingClientRect()
      tx = (e.clientX - (r.left + r.width / 2)) * strength
      ty = (e.clientY - (r.top + r.height / 2)) * strength
      kick()
    }
    const leave = () => { tx = 0; ty = 0; kick() }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      cancelAnimationFrame(raf)
    }
  }, [strength])

  return (
    <div ref={ref} className={`inline-flex will-change-transform ${className}`}>
      {children}
    </div>
  )
}
