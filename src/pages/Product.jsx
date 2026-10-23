import { useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { formatPrice, stockLabel } from '../lib/format.js'
import { categoryById } from '../config.js'
import ProductCard from '../components/ProductCard.jsx'
import Cover from '../components/Cover.jsx'
import Magnetic from '../components/Magnetic.jsx'
import VerifiedSeller from '../components/VerifiedSeller.jsx'
import ReviewList from '../components/ReviewList.jsx'
import { SEED_REVIEWS } from '../data/reviews.js'
import { reviewsForListing, averageRating } from '../lib/reviews.js'
import { CONFIG } from '../config.js'
import { useReveal } from '../lib/motion.js'

const toneText = { lime: 'text-lime-ink', amber: 'text-lime-ink', danger: 'text-danger' }

export default function Product() {
  const { id } = useParams()
  const navigate = useNavigate()
  const listing = useStore((s) => s.listings.find((l) => l.id === id))
  const listings = useStore((s) => s.listings)
  const currency = useStore((s) => s.currency)
  const addToCart = useStore((s) => s.addToCart)
  const storedReviews = useStore((s) => s.reviews)
  const scope = useRef(null)
  useReveal(scope, [id])

  // hero art pop + price count-in are CSS (fx.css [data-pop] / [data-pdetail])

  if (!listing) {
    return (
      <div className="card p-10 text-center">
        <p className="font-display text-xl">Listing not found</p>
        <Link to="/" className="btn-ghost mt-4 inline-flex">BACK TO SHOP</Link>
      </div>
    )
  }

  const cat = categoryById(listing.category)
  const stock = stockLabel(listing)
  const soldOut = listing.status === 'sold' || listing.stock <= 0
  const related = listings
    .filter((l) => l.category === listing.category && l.id !== listing.id && l.status === 'active' && l.stock > 0)
    .slice(0, 4)

  const reviews = listing ? reviewsForListing(listing.id, SEED_REVIEWS, storedReviews, CONFIG.showSeedReviews) : []

  const buyNow = () => {
    if (addToCart(listing.id)) navigate('/checkout')
  }

  return (
    <div ref={scope} className="flex flex-col gap-8">
      <nav data-reveal className="text-xs font-display text-muted flex flex-wrap gap-2">
        <Link to="/" className="hover:text-lime-ink">SHOP</Link>
        <span>/</span>
        <Link to={`/category/${listing.category}`} className="hover:text-lime-ink">{cat?.short.toUpperCase()}</Link>
        <span>/</span>
        <span className="text-bone truncate">{listing.brand.toUpperCase()}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-6 md:gap-10">
        <div data-reveal className="card relative h-72 md:h-auto md:min-h-[420px] overflow-hidden rounded-[2rem]">
          <Cover listing={listing} eager className="absolute inset-0 rounded-none" />
          {soldOut && <span className="absolute top-4 left-4 bg-danger text-white font-display text-sm px-3.5 py-1 rounded-full">Sold out</span>}
        </div>

        <div className="flex flex-col gap-5">
          <div data-pdetail>
            <p className="font-display text-xs text-lime-ink tracking-[0.25em]">{listing.brand.toUpperCase()}</p>
            <h1 className="font-display text-3xl md:text-5xl leading-[0.95] mt-2">{listing.title}</h1>
          </div>

          <div data-pdetail className="flex flex-wrap items-center gap-2">
            <VerifiedSeller />
            {reviews.length > 0 && (
              <span className="text-xs text-muted">★ {averageRating(reviews).toFixed(1)} · {reviews.length} review{reviews.length > 1 ? 's' : ''}</span>
            )}
          </div>

          <div data-pdetail className="flex items-end gap-4 flex-wrap">
            <span className="font-display text-4xl md:text-5xl text-lime-ink text-glow">{formatPrice(listing.price_ngn, currency)}</span>
            {currency === 'NGN' && <span className="text-muted text-sm mb-2">≈ {formatPrice(listing.price_ngn, 'USD')}</span>}
          </div>

          <div data-pdetail className="flex items-center gap-2">
            <span className="text-xs font-display text-muted">STATUS</span>
            <span className={`font-display text-sm ${toneText[stock.tone]}`}>{stock.text}</span>
          </div>

          <p data-pdetail className="text-muted leading-relaxed">{listing.description}</p>

          <div data-pdetail className="flex flex-col sm:flex-row gap-3">
            <Magnetic className="flex-1">
              <button disabled={soldOut} onClick={() => addToCart(listing.id)} className="btn gold-pulse w-full">ADD TO CART</button>
            </Magnetic>
            <Magnetic className="flex-1">
              <button disabled={soldOut} onClick={buyNow} className="btn-ghost w-full">BUY NOW</button>
            </Magnetic>
          </div>
          <p data-pdetail className="text-xs text-muted">
            Manual bank transfer at checkout. Credentials or codes are sent in the order chat after we confirm your payment.
          </p>
        </div>
      </div>

      <section data-reveal className="card p-5 md:p-7">
        <h2 className="font-display text-xl mb-4">SPECS</h2>
        <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
          {Object.entries(listing.specs || {}).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-line py-2.5">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right">{String(v)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section data-reveal className="card p-5 md:p-7">
        <h2 className="font-display text-xl mb-4">BUYER REVIEWS</h2>
        <ReviewList reviews={reviews} />
      </section>

      {related.length > 0 && (
        <section>
          <h2 data-io="slide" className="font-display text-xl mb-4">MORE {cat?.short.toUpperCase()}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {related.map((l) => (
              <ProductCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
