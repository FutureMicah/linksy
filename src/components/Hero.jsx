import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { reducedMotion, finePointer } from '../lib/motion.js'
import { CATEGORIES } from '../config.js'
import Magnetic from './Magnetic.jsx'
import Cover from './Cover.jsx'

const ORB_SPEED = [0.3, 0.55, 0.18]

// 8 gold sparkles, fixed positions so the hero is identical on every render
const SPARKLES = [
  { '--sx': '12%', '--sy': '18%', '--ss': '5px', '--dx': '12px', '--dy': '-20px', '--sd': '9s', '--st': '2.4s', '--sdl': '0s' },
  { '--sx': '34%', '--sy': '66%', '--ss': '4px', '--dx': '-10px', '--dy': '-24px', '--sd': '11s', '--st': '3.1s', '--sdl': '-3s' },
  { '--sx': '58%', '--sy': '12%', '--ss': '6px', '--dx': '16px', '--dy': '-18px', '--sd': '8s', '--st': '2.8s', '--sdl': '-1.5s' },
  { '--sx': '76%', '--sy': '46%', '--ss': '4px', '--dx': '-14px', '--dy': '-26px', '--sd': '12s', '--st': '3.4s', '--sdl': '-6s' },
  { '--sx': '88%', '--sy': '80%', '--ss': '5px', '--dx': '10px', '--dy': '-16px', '--sd': '9.5s', '--st': '2.2s', '--sdl': '-4s' },
  { '--sx': '46%', '--sy': '86%', '--ss': '3px', '--dx': '-8px', '--dy': '-22px', '--sd': '10s', '--st': '2.9s', '--sdl': '-2s' },
  { '--sx': '22%', '--sy': '40%', '--ss': '4px', '--dx': '18px', '--dy': '-28px', '--sd': '13s', '--st': '3.6s', '--sdl': '-7s' },
  { '--sx': '66%', '--sy': '28%', '--ss': '3px', '--dx': '-12px', '--dy': '-20px', '--sd': '9s', '--st': '2.6s', '--sdl': '-5s' },
]

// the glass panel rises in 3D only on the first mount of this page load (not on every category visit)
let heroSeen = false


export default function Hero({ stats, lines, sub }) {
  const ref = useRef(null)
  const [l1, l2, l3] = lines || ['Gaming', 'accounts.', 'Gift cards.']
  const [enter] = useState(() => {
    const first = !heroSeen
    heroSeen = true
    return first
  })

  // entrance is CSS (see fx.css hero rules). this effect only runs the count-up and the scroll parallax.
  useEffect(() => {
    const root = ref.current
    if (!root) return undefined
    const counters = Array.from(root.querySelectorAll('[data-count]'))
    if (reducedMotion()) {
      counters.forEach((el) => (el.textContent = el.dataset.count))
      return undefined
    }
    let raf = 0
    const t0 = window.setTimeout(() => {
      const start = performance.now()
      const tick = (now) => {
        const p = Math.min(1, (now - start) / 1900)
        const e = 1 - Math.pow(1 - p, 2)
        counters.forEach((el) => (el.textContent = Math.round((Number(el.dataset.count) || 0) * e)))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, 700)

    // parallax: each orb drifts at its own depth while the hero scrolls away
    const parallax = Array.from(root.querySelectorAll('[data-parallax]'))
    let pr = 0
    const upd = () => {
      pr = 0
      const r = root.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)))
      parallax.forEach((el) => {
        el.style.transform = `translate3d(0,${(-Number(el.dataset.speed) * 90 * p).toFixed(2)}%,0)`
      })
    }
    const onScroll = () => { if (!pr) pr = requestAnimationFrame(upd) }
    if (parallax.length) {
      window.addEventListener('scroll', onScroll, { passive: true })
      upd()
    }
    return () => {
      window.clearTimeout(t0)
      cancelAnimationFrame(raf)
      cancelAnimationFrame(pr)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const onMove = (e) => {
    if (!finePointer() || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`)
    ref.current.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <section ref={ref} onPointerMove={onMove} className={`relative overflow-hidden border border-line bg-panel/40 md:rounded-sm ${enter ? 'hero-enter' : ''}`}>
      <div className="spot pointer-events-none absolute inset-0" />
      <div className="light-leak" aria-hidden="true" />
      <div className="sparkle-field" aria-hidden="true">
        {SPARKLES.map((s, i) => (
          <span key={i} className="sparkle" style={s} />
        ))}
      </div>
      <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(163,230,53,0.16),rgba(163,230,53,0))] pointer-events-none" />
      <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(8,145,178,0.12),rgba(8,145,178,0))] pointer-events-none" />

      <div className="relative grid md:grid-cols-[1.25fr_0.85fr] gap-8 px-5 py-12 md:px-12 md:py-20 items-center min-h-[62vh]">
        <div className="flex flex-col gap-5">
          <p data-hero-fade className="font-display text-[11px] tracking-[0.32em] text-cyan">
            DIGITAL GOODS / INSTANT HANDOVER
          </p>
          <h1 className="font-display uppercase leading-[0.88] text-[clamp(3.2rem,14vw,7.5rem)]">
            <span className="flex items-center gap-3 overflow-hidden pb-1"><span data-hero-line className="block foil-text">{l1}</span><img src="/img/decor/art-01.webp" alt="" width="64" height="90" className="hero-chip hero-chip--a w-[clamp(56px,16vw,96px)] md:w-24 aspect-[2/3] h-auto object-cover rounded-2xl shrink-0" /></span>
            <span className="flex items-center gap-3 overflow-hidden pb-1"><span data-hero-line className="block foil-text">{l2}</span><img src="/img/decor/art-05.webp" alt="" width="64" height="90" className="hero-chip hero-chip--b w-[clamp(48px,14vw,128px)] md:w-32 aspect-[2/3] h-auto object-cover rounded-[1.25rem] shrink-0" /></span>
            <span className="flex items-center gap-3 overflow-hidden pb-1"><span data-hero-line className="block foil-text">{l3}</span><img src="/img/decor/art-03.webp" alt="" width="64" height="90" className="hero-chip hero-chip--c max-[379px]:hidden w-16 aspect-[2/3] h-auto object-cover rounded-2xl shrink-0 [clip-path:polygon(0_0,100%_0,100%_72%,72%_100%,0_100%)]" /></span>
          </h1>
          <p data-hero-fade className="text-muted max-w-md text-[15px] leading-relaxed">
            {sub}
          </p>
          <div data-hero-fade className="flex flex-wrap gap-3 pt-2">
            <Magnetic>
              <Link to="/category/gaming" className="btn">Shop gaming</Link>
            </Magnetic>
            <Magnetic>
              <Link to="/category/giftcards" className="btn-ghost">Gift cards</Link>
            </Magnetic>
          </div>
          <div data-hero-fade className="grid grid-cols-3 gap-3 pt-6 max-w-md">
            {stats.map((s) => (
              <div key={s.label} className="border-l border-lime/40 pl-3">
                <div className="font-display text-3xl md:text-4xl text-lime-ink leading-none">
                  <span data-count={s.value}>0</span>
                </div>
                <div className="text-[11px] font-display tracking-wider text-muted mt-1 uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative h-[260px] md:h-[440px]">
          {CATEGORIES.map((c, i) => {
            const pos = [
              'left-[6%] top-[4%] w-[46%] md:w-[52%] aspect-square',
              'right-[2%] top-[30%] w-[40%] md:w-[44%] aspect-square',
              'left-[22%] bottom-[0%] w-[36%] md:w-[38%] aspect-square',
            ][i]
            return (
              <div
                key={c.id}
                data-orb
                data-parallax
                data-speed={ORB_SPEED[i]}
                className={`orb absolute ${pos} rounded-2xl flex flex-col items-center justify-center gap-2`}
              >
                <Cover category={c.id} className="h-[62%] w-[62%] rounded-2xl" />
                <span className="font-display text-[11px] md:text-xs tracking-widest text-bone">{c.short}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
