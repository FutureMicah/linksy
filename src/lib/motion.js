import { useLayoutEffect } from 'react'

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const finePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

// Scroll reveal for every [data-reveal] inside the scope (IntersectionObserver + CSS .rv / .rv-in).
// Reduced motion: nothing is hidden, nothing is added.
export function useReveal(scope, deps = []) {
  useLayoutEffect(() => {
    const root = scope.current
    if (!root || reducedMotion() || typeof IntersectionObserver === 'undefined') return undefined
    const els = Array.from(root.querySelectorAll('[data-reveal]'))
    if (!els.length) return undefined
    els.forEach((el) => el.classList.add('rv'))
    const io = new IntersectionObserver(
      (entries) => {
        let i = 0
        for (const e of entries) {
          if (!e.isIntersecting) continue
          e.target.style.transitionDelay = `${Math.min(i++, 8) * 90}ms`
          e.target.classList.add('rv-in')
          io.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0 },
    )
    els.forEach((el) => io.observe(el))
    return () => {
      io.disconnect()
      els.forEach((el) => el.classList.remove('rv', 'rv-in'))
    }
  }, deps)
}
