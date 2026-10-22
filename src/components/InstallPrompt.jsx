import { useEffect, useState } from 'react'
import { canInstall, isIOS, isStandalone, onInstallChange, promptInstall } from '../lib/pwa.js'

const DISMISS_KEY = 'ap_install_dismissed'

// bottom sheet offering install. Android/desktop: native prompt. iOS: add-to-home-screen hint.
export default function InstallPrompt() {
  const [ready, setReady] = useState(canInstall())
  const [show, setShow] = useState(false)
  const ios = isIOS()

  useEffect(() => {
    if (isStandalone()) return
    try {
      if (localStorage.getItem(DISMISS_KEY) || localStorage.getItem('ap_installed')) return
    } catch {}
    const t = setTimeout(() => setShow(true), 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => onInstallChange((v) => setReady(v)), [])

  if (!show || isStandalone()) return null
  if (!ready && !ios) return null

  const dismiss = () => {
    setShow(false)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
  }

  return (
    <div
      role="dialog"
      aria-label="install linksy app"
      className="install-enter glass glow-gold fixed left-3 right-3 z-[80] mx-auto max-w-md rounded-sm p-4"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-start gap-3">
        <img src="/icons/icon-192.png" alt="" width="44" height="44" className="rounded-sm" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg text-bone">Install linksy</p>
          <p className="text-xs leading-relaxed text-muted">
            {ios
              ? 'tap Share, then "Add to Home Screen" for the app experience.'
              : 'add it to your home screen. opens full screen, and the shell works offline.'}
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {!ios && (
          <button
            type="button"
            className="btn flex-1 !py-2.5"
            onClick={async () => {
              const r = await promptInstall()
              if (r === 'accepted') setShow(false)
              else dismiss()
            }}
          >
            Install app
          </button>
        )}
        <button type="button" className="btn-ghost flex-1 !py-2.5" onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  )
}
