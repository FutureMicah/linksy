import { useEffect, useState } from 'react'
import { getLenis } from '../lib/lenis.js'
import { reducedMotion } from '../lib/motion.js'

// Floating glass button: appears after the visitor scrolls down, smooth-scrolls to the top.
export default function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const top = () => {
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(0, { duration: reducedMotion() ? 0 : 0.9 })
    else window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={top}
      aria-label="back to top"
      tabIndex={show ? 0 : -1}
      className={`back-to-top tap fixed right-4 bottom-5 md:right-6 md:bottom-6 z-30 grid place-items-center w-11 h-11 rounded-full glass text-bone ${show ? 'is-on' : ''}`}
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  )
}
