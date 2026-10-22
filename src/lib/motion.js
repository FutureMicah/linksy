import { useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export { gsap, ScrollTrigger, useGSAP }

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const finePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

// Scroll-triggered reveal for every [data-reveal] inside the scope. Re-runs when deps change.
export function useReveal(scope, deps = []) {
  useGSAP(
    () => {
      if (reducedMotion() || !scope.current) return
      const els = Array.from(scope.current.querySelectorAll('[data-reveal]'))
      if (!els.length) return
      gsap.set(els, { opacity: 0, y: 48 })
      ScrollTrigger.batch(els, {
        start: 'top 92%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            stagger: 0.09,
            overwrite: true,
          }),
      })
    },
    { scope, dependencies: deps },
  )
}

export { useRef }
