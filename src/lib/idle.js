import { useEffect, useState } from 'react'

// decorative layers mount after the splash has been released (linksy:ready) and the first paint is done.
// requestIdleCallback when available, 300ms otherwise. A 2s fallback means nothing waits forever.
let readyFired = false
if (typeof window !== 'undefined') {
  window.addEventListener('linksy:ready', () => { readyFired = true }, { once: true })
}

const whenIdle = (fn) =>
  typeof window.requestIdleCallback === 'function'
    ? window.requestIdleCallback(fn, { timeout: 1000 })
    : window.setTimeout(fn, 300)

export function useDeferredReady(delay = 300) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    let started = false
    let t = 0
    const go = () => {
      if (started) return
      started = true
      t = window.setTimeout(() => {
        if (!cancelled) whenIdle(() => { if (!cancelled) setReady(true) })
      }, delay)
    }
    const onReady = () => go()
    if (readyFired) go()
    else window.addEventListener('linksy:ready', onReady, { once: true })
    const fb = window.setTimeout(go, 2000)
    return () => {
      cancelled = true
      window.clearTimeout(t)
      window.clearTimeout(fb)
      window.removeEventListener('linksy:ready', onReady)
    }
  }, [delay])
  return ready
}
