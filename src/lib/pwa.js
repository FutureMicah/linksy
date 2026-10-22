// service worker registration (production only) and install-prompt state
let deferred = null
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn(!!deferred))

export function registerSW() {
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

export function canInstall() {
  return !!deferred
}

export function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  )
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function onInstallChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export async function promptInstall() {
  if (!deferred) return 'unavailable'
  deferred.prompt()
  const { outcome } = await deferred.userChoice
  deferred = null
  emit()
  return outcome
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferred = e
  emit()
})
window.addEventListener('appinstalled', () => {
  deferred = null
  try { localStorage.setItem('ap_installed', '1') } catch {}
  emit()
})
