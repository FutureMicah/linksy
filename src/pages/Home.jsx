import { WordStagger } from '../components/fx.jsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import ProductCard from '../components/ProductCard.jsx'
import Cover from '../components/Cover.jsx'
import ArtStrip from '../components/ArtStrip.jsx'
import Hero from '../components/Hero.jsx'
import Marquee from '../components/Marquee.jsx'
import TrustStrip from '../components/TrustStrip.jsx'
import FeaturedCarousel from '../components/FeaturedCarousel.jsx'
import { CATEGORIES, categoryById } from '../config.js'
import { useReveal, reducedMotion } from '../lib/motion.js'

const FAQS = [
  { q: 'How long does delivery take?', a: 'Usually within minutes of payment being confirmed. Credentials are sent to your WhatsApp chat.' },
  { q: 'What payment methods are accepted?', a: 'Manual bank transfer in naira to the account shown at checkout. Send the exact amount and share your proof of payment.' },
  { q: 'Are the accounts safe to use?', a: 'Every listing states its status. We hand over only what is described, and support is available in chat if anything is off.' },
  { q: 'What is your refund policy?', a: 'If the delivery does not match the listing or you cannot access what you paid for, contact us in chat within the stated window and we review it for a refund or replacement.' },
]

const SORTS = {
  newest: 'Newest',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
}

export default function Home() {
  const { category } = useParams()
  const listings = useStore((s) => s.listings)
  const siteSettings = useStore((s) => s.siteSettings)
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [maxPrice, setMaxPrice] = useState(0) // 0 = any
  const [sort, setSort] = useState('newest')
  const scope = useRef(null)

  const activeCat = categoryById(category)

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    let list = listings.filter((l) => l.status !== 'hidden')
    if (activeCat) list = list.filter((l) => l.category === activeCat.id)
    if (term) {
      list = list.filter((l) =>
        [l.title, l.brand, l.description, ...Object.values(l.specs || {})].join(' ').toLowerCase().includes(term),
      )
    }
    if (inStockOnly) list = list.filter((l) => l.status === 'active' && l.stock > 0)
    if (maxPrice) list = list.filter((l) => l.price_ngn <= maxPrice)
    const sorted = [...list]
    if (sort === 'price_asc') sorted.sort((a, b) => a.price_ngn - b.price_ngn)
    else if (sort === 'price_desc') sorted.sort((a, b) => b.price_ngn - a.price_ngn)
    else sorted.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    return sorted
  }, [listings, activeCat, q, inStockOnly, maxPrice, sort])

  useReveal(scope, [results.length, category])

  const onSearch = (e) => {
    e.preventDefault()
    setParams(q.trim() ? { q: q.trim() } : {})
  }

  // the 3 most recently created live listings get the floating hot pill
  const hotIds = useMemo(() => {
    const live = listings.filter((l) => l.status === 'active' && l.stock > 0)
    return new Set([...live].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 3).map((l) => l.id))
  }, [listings])

  // one-time shimmer on section headers as they scroll into view
  useEffect(() => {
    const heads = document.querySelectorAll('[data-shine]:not(.shine-in)')
    if (!heads.length || typeof IntersectionObserver === 'undefined' || reducedMotion()) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('shine-in')
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.6 })
    heads.forEach((h) => io.observe(h))
    return () => io.disconnect()
  }, [activeCat, listings.length])

  const stats = useMemo(() => {
    const active = listings.filter((l) => l.status === 'active' && l.stock > 0)
    return [
      { label: 'Live listings', value: active.length },
      { label: 'Categories', value: CATEGORIES.length },
      { label: 'Sold out', value: listings.filter((l) => l.status === 'sold' || l.stock <= 0).length },
    ]
  }, [listings])

  return (
    <div ref={scope} className="flex flex-col gap-8 md:gap-10">
      {!activeCat && (
        <>
          <Hero stats={stats} lines={siteSettings.heroLines} sub={siteSettings.heroSub} />
          <TrustStrip items={siteSettings.trustItems} />
          <section data-reveal>
            <FeaturedCarousel />
          </section>
          <Marquee items={['Gaming accounts', 'Social accounts', 'Gift cards', 'Naira pricing', 'Bank transfer', 'Delivered in chat']} />

          <section data-reveal aria-label="Categories" id="categories">
            <WordStagger text="Shop by category" className="shine-head font-display text-xl mb-4" data-shine />
            <div className="snap-row md:grid md:grid-cols-3 md:overflow-visible md:snap-none md:gap-4">
            {CATEGORIES.map((c) => (
              <Link
                key={c.id}
                to={`/category/${c.id}`}
                className="card card-hover group snap-start w-[78vw] max-w-[360px] md:w-auto md:max-w-none p-5 md:p-6 flex items-center justify-between overflow-hidden"
              >
                <div>
                  <div className="font-display text-2xl md:text-3xl">{c.label}</div>
                  <div className="text-xs text-muted mt-1 font-display tracking-widest group-hover:text-lime-ink transition-colors">
                    SHOP NOW →
                  </div>
                </div>
                <span className="text-4xl md:text-5xl transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-12">
                <Cover category={c.id} className="h-[62%] w-[62%] rounded-2xl" />
                </span>
              </Link>
            ))}
            </div>
          </section>
          <section data-reveal className="grid gap-4 md:grid-cols-3" aria-label="Why choose linksy">
            <div className="card p-6 flex flex-col gap-2"><span className="font-display text-xs text-cyan">01</span><h3 className="font-display text-lg">Instant chat delivery</h3><p className="text-muted text-sm">Your credentials land in your WhatsApp chat the moment payment is confirmed.</p></div>
            <div className="card p-6 flex flex-col gap-2"><span className="font-display text-xs text-cyan">02</span><h3 className="font-display text-lg">Escrow-style manual verification</h3><p className="text-muted text-sm">We check every bank transfer by hand before anything is released.</p></div>
            <div className="card p-6 flex flex-col gap-2"><span className="font-display text-xs text-cyan">03</span><h3 className="font-display text-lg">Verified sellers</h3><p className="text-muted text-sm">Every listing is vetted by linksy before it goes live.</p></div>
          </section>

          <section data-reveal aria-label="Browse">
            <h2 className="shine-head font-display text-xl mb-4" data-shine><span data-io="line" data-io-stagger="0"><span data-io="crawl">Browse the wall</span></span></h2>
            <ArtStrip items={listings.filter((l) => l.status !== 'hidden').slice(0, 10)} />
          </section>

          <section data-reveal aria-label="How it works">
            <WordStagger text="How it works" className="shine-head font-display text-xl mb-4" data-shine />
            <ol className="grid gap-4 md:grid-cols-3">
              <li className="card p-6 flex gap-4"><span className="grad-text font-display text-3xl">1</span><div><p className="font-display">Pick listing</p><p className="text-muted text-sm">Choose the account or gift card you want.</p></div></li>
              <li className="card p-6 flex gap-4"><span className="grad-text font-display text-3xl">2</span><div><p className="font-display">Pay by bank transfer</p><p className="text-muted text-sm">Send the exact naira amount to the account shown at checkout.</p></div></li>
              <li className="card p-6 flex gap-4"><span className="grad-text font-display text-3xl">3</span><div><p className="font-display">Receive credentials in WhatsApp chat</p><p className="text-muted text-sm">We confirm payment and send your delivery to your WhatsApp chat.</p></div></li>
            </ol>
          </section>

          <section data-reveal aria-label="FAQ">
            <WordStagger text="Questions" className="shine-head font-display text-xl mb-4" data-shine />
            <div className="flex flex-col gap-2">
              {FAQS.map((f) => (
                <details key={f.q} className="card p-5 group">
                  <summary className="cursor-pointer font-display text-sm list-none flex justify-between gap-4">{f.q}<span className="text-cyan group-open:rotate-45 transition-transform">+</span></summary>
                  <p className="text-muted text-sm mt-3 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </>
      )}

      {activeCat && (
        <div data-reveal>
          <p className="font-display text-xs text-cyan tracking-[0.3em]">CATEGORY</p>
          <h1 className="font-display text-4xl md:text-6xl mt-1 leading-none">
              {activeCat.label}
          </h1>
        </div>
      )}

      {/* search + filters */}
      <div data-reveal className="card p-3 md:p-4 flex flex-col gap-3">
        <form onSubmit={onSearch} className="flex gap-2">
          <input
            className="input"
            placeholder="Search Fortnite, TikTok, Amazon..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn !px-5" type="submit">SEARCH</button>
        </form>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center gap-2 border border-line px-3 py-2 cursor-pointer hover:border-lime/50 transition-colors">
            <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="accent-lime" />
            <span className="font-display tracking-wider">IN STOCK ONLY</span>
          </label>
          <select className="input !w-auto !py-2" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}>
            <option value={0}>Any price</option>
            <option value={50000}>Under ₦50,000</option>
            <option value={100000}>Under ₦100,000</option>
            <option value={200000}>Under ₦200,000</option>
          </select>
          <select className="input !w-auto !py-2" value={sort} onChange={(e) => setSort(e.target.value)}>
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <span className="ml-auto text-muted font-display tracking-wider">{results.length} LISTINGS</span>
        </div>
      </div>

      {results.length === 0 ? (
        <div data-reveal className="card p-10 text-center text-muted">
          <p className="font-display text-2xl text-bone">No match</p>
          <p className="text-sm mt-1">Try another search or clear the filters.</p>
        </div>
      ) : (
        <div key={`${category}-${q}-${inStockOnly}-${maxPrice}-${sort}`} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
          {results.map((l) => (
            <ProductCard key={l.id} listing={l} hot={hotIds.has(l.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
