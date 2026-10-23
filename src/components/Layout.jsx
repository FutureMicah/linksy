import { Suspense, lazy, useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { gsap, useGSAP, reducedMotion } from '../lib/motion.js'
import { getLenis } from '../lib/lenis.js'
import Magnetic from './Magnetic.jsx'
import { ScrollProgress, CursorGlow, useRipple, useScrollFx, useScrollReactive } from './fx.jsx'
// decorative / non-critical layers load after first paint so the shell JS stays small
const Aurora = lazy(() => import('./Aurora.jsx'))
const Spider = lazy(() => import('./Spider.jsx'))
const FloatingArt = lazy(() => import('./FloatingArt.jsx'))
const Countdown = lazy(() => import('./Countdown.jsx'))
const BackToTop = lazy(() => import('./BackToTop.jsx'))
const HeaderSearch = lazy(() => import('./HeaderSearch.jsx'))

const linkCls = ({ isActive }) =>
  `relative transition-colors ${isActive ? 'text-lime-ink' : 'text-muted hover:text-bone'}`

function LogoMark({ className = '' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lsg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ecfccb" />
          <stop offset="1" stopColor="#d9f99d" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#lsg)" />
      <rect x="1" y="1" width="30" height="15" rx="9" fill="#ffffff" fillOpacity="0.22" />
      <path d="M11 7h4.2v12.6H23V24H11z" fill="#0b0d0c" />
    </svg>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  const cartCount = useStore((s) => s.cart.reduce((n, c) => n + c.qty, 0))
  const currency = useStore((s) => s.currency)
  const setCurrency = useStore((s) => s.setCurrency)
  const spiderOn = useStore((s) => s.spiderOn)
  const setSpiderOn = useStore((s) => s.setSpiderOn)

  const mainRef = useRef(null)
  useRipple()
  useScrollFx(mainRef, pathname)
  useScrollReactive(mainRef, pathname)
  const headerRef = useRef(null)
  const badgeRef = useRef(null)
  const cartRef = useRef(null)
  const showAurora = pathname === '/' || pathname.startsWith('/product/')

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

  // route change: reset scroll. The page crossfade is the keyed .route-fade wrapper below (CSS only).
  useEffect(() => {
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [pathname])

  // cart badge bounce
  useEffect(() => {
    if (!badgeRef.current || reducedMotion()) return
    gsap.fromTo(badgeRef.current, { scale: 0.3 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
  }, [cartCount])

  // cart icon bounces once each time an item is added (count goes up)
  const prevCount = useRef(cartCount)
  useEffect(() => {
    const el = cartRef.current
    if (el && cartCount > prevCount.current && !reducedMotion()) {
      el.classList.remove('cart-bump')
      void el.offsetWidth // restart the animation if it is already running
      el.classList.add('cart-bump')
    }
    prevCount.current = cartCount
  }, [cartCount])

  return (
    <div className="grain min-h-screen flex flex-col">
      <div className="ambient" />
      <Suspense fallback={null}>
        <FloatingArt key={pathname} />
      </Suspense>
      <ScrollProgress />
      {showAurora && (
        <Suspense fallback={null}>
          <Aurora />
        </Suspense>
      )}
      <CursorGlow />
      {spiderOn && !reducedMotion() && (
        <Suspense fallback={null}>
          <Spider />
        </Suspense>
      )}

      <header ref={headerRef} className="sticky top-0 z-40 bg-ink/75 backdrop-blur-md border-b border-line">
        <div className="grad-stream absolute inset-x-0 top-0 h-[2px]" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3">
          <Link data-nav to="/" className="flex items-center gap-2 shrink-0">
            <LogoMark className="w-8 h-8 shrink-0" />
            <span className="font-display text-xl md:text-2xl leading-none tracking-wide">
              LINK<span className="text-lime-ink">SY</span>
            </span>
          </Link>

          <nav data-nav className="hidden md:flex items-center gap-7 font-display text-sm">
            <NavLink to="/" end className={linkCls}>Shop</NavLink>
            <NavLink to="/category/gaming" className={linkCls}>Gaming</NavLink>
            <NavLink to="/category/social" className={linkCls}>Social</NavLink>
            <NavLink to="/category/giftcards" className={linkCls}>Gift Cards</NavLink>
          </nav>

          <div data-nav className="flex items-center gap-2">
            <Suspense fallback={null}>
              <HeaderSearch />
            </Suspense>
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
              <Link ref={cartRef} to="/cart" onAnimationEnd={(e) => e.currentTarget.classList.remove('cart-bump')} className="btn-ghost !py-2 !px-3.5 relative">
                CART
                {cartCount > 0 && (
                  <span
                    ref={badgeRef}
                    className="absolute -top-2 -right-2 bg-lime text-ink text-[10px] font-bold min-w-5 h-5 px-1 grid place-items-center rounded-full shadow-[0_0_14px_rgba(163,230,53,0.6)]"
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            </Magnetic>
          </div>
        </div>

        {/* mobile category chips */}
        <div className="md:hidden px-4 pb-3 chip-row">
          {[['/', 'All', true], ['/category/gaming', 'Gaming'], ['/category/social', 'Social'], ['/category/giftcards', 'Gift Cards']].map(([to, label, end]) => (
            <NavLink key={to} to={to} end={!!end} className={({ isActive }) => `chip${isActive ? ' is-active' : ''}`}>{label}</NavLink>
          ))}
        </div>
      </header>

      <Suspense fallback={null}>
        <Countdown />
      </Suspense>

      <main ref={mainRef} className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 pb-28 md:pb-10 overflow-x-clip">
        <Suspense fallback={<div className="min-h-[50vh]" />}>
          <div key={pathname} className="route-fade">
            <Outlet />
          </div>
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <BackToTop />
      </Suspense>


      <nav className="app-nav md:hidden" aria-label="App">
        <NavLink to="/" end>{({ isActive }) => <><span>◆</span><span>Shop</span></>}</NavLink>
        <a href="/#categories" onClick={(e) => { const el = document.getElementById('categories'); if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }) } }}><span>▦</span><span>Categories</span></a>
        <NavLink to="/cart"><span>🛒</span><span>Cart{cartCount > 0 ? ` (${cartCount})` : ''}</span></NavLink>
        <NavLink to="/admin"><span>⚙</span><span>Admin</span></NavLink>
      </nav>

      <footer className="relative mt-10 border-t border-line">
        <div className="hairline grad-stream absolute inset-x-0 -top-px" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 flex flex-col md:flex-row gap-4 md:items-center md:justify-between text-xs text-muted">
          <span className="font-display text-sm text-bone/80 tracking-wider">
            LINK<span className="text-lime-ink">SY</span>. DIGITAL GOODS, DELIVERED AFTER PAYMENT.
          </span>
          <span>Checkout is a manual bank transfer. Bank details are placeholders until you set them in your env.</span>
          <button
            type="button"
            onClick={() => setSpiderOn(!spiderOn)}
            aria-pressed={spiderOn}
            className="tap self-start md:self-auto rounded-full border border-line px-3 py-1.5 text-[11px] font-display text-bone/80 hover:text-bone transition-colors"
          >
            spider: {spiderOn ? 'on' : 'off'}
          </button>
        </div>
      </footer>
    </div>
  )
}
