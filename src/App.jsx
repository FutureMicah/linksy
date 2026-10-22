import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import { initSmoothScroll, getLenis } from './lib/lenis.js'
import { ScrollTrigger } from './lib/motion.js'

// route-level code splitting for everything except the storefront landing
const Product = lazy(() => import('./pages/Product.jsx'))
const Cart = lazy(() => import('./pages/Cart.jsx'))
const Checkout = lazy(() => import('./pages/Checkout.jsx'))
const Order = lazy(() => import('./pages/Order.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

export default function App() {
  const { pathname } = useLocation()

  useEffect(() => {
    initSmoothScroll()
    return () => {}
  }, [])

  // re-measure scroll triggers after each route swap
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      getLenis()?.resize()
    })
    return () => cancelAnimationFrame(id)
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
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
