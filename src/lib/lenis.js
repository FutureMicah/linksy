import Lenis from 'lenis'
import { gsap, ScrollTrigger, reducedMotion } from './motion.js'

let lenis = null

// Smooth wheel scrolling driven by GSAP's ticker so ScrollTrigger stays in sync.
// Skipped entirely when the user asks for reduced motion.
export function initSmoothScroll() {
  if (lenis || reducedMotion()) return lenis
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.2,
  })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export const getLenis = () => lenis
