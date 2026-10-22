import { Suspense, useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { gsap, useGSAP, reducedMotion } from '../lib/motion.js'
import { getLenis } from '../lib/lenis.js'
import Magnetic from './Magnetic.jsx'

const linkCls = ({ isActive }) =>
  `relative transition-colors ${isActive ? 'text-lime' : 'text-muted hover:text-bone'}`

export default function Layout() {
  const { pathname } = useLocation()
  const cartCount = useStore((s) => s.cart.reduce((n, c) => n + c.qty, 0))
  const currency = useStore((s) => s.currency)
  const setCurrency = useStore((s) => s.setCurrency)

  const mainRef = useRef(null)
  const headerRef = useRef(null)
  const badgeRef = useRef(null)

  // header entrance
  useGSAP(
    () => {
      if (reducedMotion() || !headerRef.current) return
      gsap.from(headerRef.current, { yPercent: -100, duration: 0.9, ease: 'expo.out' })
      gsap.from(headerRef.current.querySelectorAll('[data-nav]'), {
        opacity: 0,
        y: -10,
        duration: 0.7,
        stagger: 0.06,
        delay: 0.25,
        ease: 'power3.out',
      })
    },
    { scope: headerRef },
  )

  // route change: reset scroll, then a short page-in transition
  useEffect(() => {
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
    if (!mainRef.current || reducedMotion()) return
    gsap.fromTo(
      mainRef.current,
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', clearProps: 'opacity,transform' },
    )
  }, [pathname])

  // cart badge bounce
  useEffect(() => {
    if (!badgeRef.current || reducedMotion()) return
    gsap.fromTo(badgeRef.current, { scale: 0.3 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
  }, [cartCount])

  return (
    <div className="grain min-h-screen flex flex-col">
      <div className="ambient" />

      <header ref={headerRef} className="sticky top-0 z-40 bg-ink/75 backdrop-blur-md border-b border-line">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3">
          <Link data-nav to="/" className="flex items-center gap-2 shrink-0">
            <span className="grid place-items-center w-8 h-8 bg-lime text-ink font-display text-sm shadow-[0_0_24px_rgba(182,255,59,0.55)]">
              AP
            </span>
            <span className="font-display text-xl md:text-2xl leading-none tracking-wide">
              ACCOUNT<span className="text-lime">PLUG</span>
            </span>
          </Link>

          <nav data-nav className="hidden md:flex items-center gap-7 font-display text-sm">
            <NavLink to="/" end className={linkCls}>Shop</NavLink>
            <NavLink to="/category/gaming" className={linkCls}>Gaming</NavLink>
            <NavLink to="/category/social" className={linkCls}>Social</NavLink>
            <NavLink to="/category/giftcards" className={linkCls}>Gift Cards</NavLink>
          </nav>

          <div data-nav className="flex items-center gap-2">
            <div className="flex border border-line text-[11px] font-display">
              {['NGN', 'USD'].map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-2.5 py-2 transition-colors tap ${currency === c ? 'bg-lime text-ink' : 'text-muted hover:text-bone'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <Magnetic strength={0.22}>
              <Link to="/cart" className="btn-ghost !py-2 !px-3.5 relative">
                CART
                {cartCount > 0 && (
                  <span
                    ref={badgeRef}
                    className="absolute -top-2 -right-2 bg-cyan text-ink text-[10px] font-bold min-w-5 h-5 px-1 grid place-items-center rounded-full shadow-[0_0_14px_rgba(71,230,255,0.7)]"
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            </Magnetic>
          </div>
        </div>

        {/* mobile category strip */}
        <div className="md:hidden border-t border-line overflow-x-auto">
          <div className="flex gap-5 px-4 py-2.5 font-display text-xs whitespace-nowrap">
            <NavLink to="/" end className={linkCls}>Shop</NavLink>
            <NavLink to="/category/gaming" className={linkCls}>Gaming</NavLink>
            <NavLink to="/category/social" className={linkCls}>Social</NavLink>
            <NavLink to="/category/giftcards" className={linkCls}>Gift Cards</NavLink>
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'text-amber' : 'text-muted')}>Admin</NavLink>
          </div>
        </div>
      </header>

      <main ref={mainRef} className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <Suspense fallback={<div className="min-h-[50vh]" />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="relative mt-10 border-t border-line">
        <div className="hairline absolute inset-x-0 -top-px" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 flex flex-col md:flex-row gap-4 md:items-center md:justify-between text-xs text-muted">
          <span className="font-display text-sm text-bone/80 tracking-wider">
            ACCOUNT<span className="text-lime">PLUG</span>. DIGITAL GOODS, DELIVERED AFTER PAYMENT.
          </span>
          <span>Checkout is a manual bank transfer. Bank details are placeholders until you set them in your env.</span>
        </div>
      </footer>
    </div>
  )
}
