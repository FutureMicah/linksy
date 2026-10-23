import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { useDeferredReady } from './lib/idle.js'
import { scroll } from './lib/scroll-state.js'

// route-level code splitting: every page, including the storefront home, is its own chunk
const Home = lazy(() => import('./pages/Home.jsx'))
const Product = lazy(() => import('./pages/Product.jsx'))
const Cart = lazy(() => import('./pages/Cart.jsx'))
const Checkout = lazy(() => import('./pages/Checkout.jsx'))
const Order = lazy(() => import('./pages/Order.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))
const JoinScreen = lazy(() => import('./pages/Admin.jsx').then((m) => ({ default: m.JoinScreen })))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))
const InstallPrompt = lazy(() => import('./components/InstallPrompt.jsx'))

// mounted inside the Suspense boundary, so it only mounts once the route chunk has loaded and committed.
// it signals main.jsx (which removes the splash after a paint) via a window event.
function ReadyBeacon() {
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => window.dispatchEvent(new Event('linksy:ready')))
    })
    return () => cancelAnimationFrame(id)
  }, [])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  // decorative stage (smooth scroll, install sheet): starts after first paint, never blocks the splash
  const decor = useDeferredReady()

  useEffect(() => {
    if (!decor) return undefined
    let cancelled = false
    import('./lib/lenis.js').then((m) => { if (!cancelled) m.initSmoothScroll() })
    return () => { cancelled = true }
  }, [decor])

  // re-measure after each route swap
  useEffect(() => {
    scroll.lenis?.resize()
  }, [pathname])

  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="category/:category" element={<Home />} />
          <Route path="product/:id" element={<Product />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order/:ref" element={<Order />} />
          <Route path="admin" element={<Admin />} />
          <Route path="admin/invite" element={<JoinScreen />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <ReadyBeacon />
      {decor && (
        <Suspense fallback={null}>
          <InstallPrompt />
        </Suspense>
      )}
    </Suspense>
  )
}
