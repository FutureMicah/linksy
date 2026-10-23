import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap, useGSAP, reducedMotion, finePointer } from '../lib/motion.js'
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


export default function Hero({ stats }) {
  const ref = useRef(null)
  const [enter] = useState(() => {
    const first = !heroSeen
    heroSeen = true
    return first
  })

  useGSAP(
    () => {
      const root = ref.current
      if (!root) return
      const q = (s) => Array.from(root.querySelectorAll(s))

      // count-up numbers (always set final value when motion is reduced)
      const counters = q('[data-count]')
      if (reducedMotion()) {
        counters.forEach((el) => (el.textContent = el.dataset.count))
        return
      }

      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.from(q('[data-hero-line]'), { yPercent: 115, duration: 1.4, stagger: 0.1 })
        .from(q('[data-hero-fade]'), { opacity: 0, y: 26, duration: 1, stagger: 0.09 }, '-=1.1')
        .from(q('[data-orb]'), { scale: 0.55, opacity: 0, rotate: -12, duration: 1.6, stagger: 0.14, ease: 'back.out(1.3)' }, '-=1.3')

      counters.forEach((el) => {
        const target = Number(el.dataset.count) || 0
        const o = { v: 0 }
        gsap.to(o, {
          v: target,
          duration: 1.9,
          delay: 0.7,
          ease: 'power2.out',
          onUpdate: () => (el.textContent = Math.round(o.v)),
        })
      })

      // parallax: each orb drifts at its own depth while the hero scrolls away
      gsap.to(q('[data-parallax]'), {
        yPercent: (i, el) => -Number(el.dataset.speed) * 90,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
      })
    },
    { scope: ref },
  )

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
      <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-lime/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-cyan/10 blur-3xl pointer-events-none" />

      <div className="relative grid md:grid-cols-[1.25fr_0.85fr] gap-8 px-5 py-12 md:px-12 md:py-20 items-center min-h-[62vh]">
        <div className="flex flex-col gap-5">
          <p data-hero-fade className="font-display text-[11px] tracking-[0.32em] text-cyan">
            DIGITAL GOODS / INSTANT HANDOVER
          </p>
          <h1 className="font-display uppercase leading-[0.88] text-[clamp(3.2rem,14vw,7.5rem)]">
            <span className="block overflow-hidden pb-1"><span data-hero-line className="block foil-text">Gaming</span></span>
            <span className="block overflow-hidden pb-1"><span data-hero-line className="block foil-text">accounts.</span></span>
            <span className="block overflow-hidden pb-1"><span data-hero-line className="block foil-text">Gift cards.</span></span>
          </h1>
          <p data-hero-fade className="text-muted max-w-md text-[15px] leading-relaxed">
            Socials and gift cards too. Pay the exact amount by bank transfer in naira, then get your delivery in the chat once we confirm.
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
