import Lenis from 'lenis'
import { reducedMotion } from './motion.js'
import { scroll } from './scroll-state.js'

// Smooth wheel scrolling on its own rAF loop (no GSAP). Skipped under reduced motion.
export function initSmoothScroll() {
  if (scroll.lenis || reducedMotion()) return scroll.lenis
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.2,
  })
  scroll.lenis = lenis
  const loop = (t) => {
    lenis.raf(t)
    scroll.raf = requestAnimationFrame(loop)
  }
  scroll.raf = requestAnimationFrame(loop)
  return lenis
}
