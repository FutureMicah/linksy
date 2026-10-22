import { useRef } from 'react'
import { gsap, useGSAP, finePointer, reducedMotion } from '../lib/motion.js'

// Wrapper that pulls its child toward the cursor (desktop with a fine pointer only).
export default function Magnetic({ children, strength = 0.32, className = '' }) {
  const ref = useRef(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el || reducedMotion() || !finePointer()) return
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.45)' })
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.45)' })
      const move = (e) => {
        const r = el.getBoundingClientRect()
        xTo((e.clientX - (r.left + r.width / 2)) * strength)
        yTo((e.clientY - (r.top + r.height / 2)) * strength)
      }
      const leave = () => {
        xTo(0)
        yTo(0)
      }
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerleave', leave)
      return () => {
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerleave', leave)
      }
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className={`inline-flex will-change-transform ${className}`}>
      {children}
    </div>
  )
}
