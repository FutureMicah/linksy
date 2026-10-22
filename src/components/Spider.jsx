import { useEffect, useRef } from 'react'

// Interactive screen spider: a fixed, pointer-transparent overlay.
// Crawls the viewport edges, scurries and clings while scrolling fast,
// darts away from pointer/touch, and drops on a silk thread when idle.
// Motion is transform + SVG path updates inside one requestAnimationFrame loop.

const L1 = 12 // upper leg segment (local units)
const L2 = 14 // lower leg segment
const REACH = 22 // rest foot distance from hip
const TOP_MIN = 96 // keep clear of the sticky header
const HIP_X = [6, 2, -3, -8]
const HIP_Y = [4, 6, 6, 4]
const THETA = [48, 82, 112, 142] // leg angles from the body's forward axis, degrees

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const rand = (a, b) => a + Math.random() * (b - a)
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const angleDiff = (a, b) => ((a - b + Math.PI * 3) % (Math.PI * 2)) - Math.PI

// 8 legs: 4 per side. group alternates so the gait stays stable.
const LEGS = []
for (const s of [1, -1]) {
  for (let j = 0; j < 4; j++) {
    const th = (THETA[j] * Math.PI) / 180
    LEGS.push({
      s,
      hip: [HIP_X[j], s * HIP_Y[j]],
      dir: [Math.cos(th), s * Math.sin(th)],
      group: (j + (s === 1 ? 0 : 1)) % 2,
      step: null,
      foot: null,
      el: null,
    })
  }
}

// two-bone IK in local units. knee bends outward on each side.
function knee(hip, foot, s, lift) {
  const dx = foot.x - hip[0]
  const dy = foot.y - hip[1]
  const d = clamp(Math.hypot(dx, dy), 3, L1 + L2 - 0.5)
  const base = Math.atan2(dy, dx)
  const cosA = clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)
  const a = Math.acos(cosA) + lift
  const ang = base + s * a
  return [hip[0] + L1 * Math.cos(ang), hip[1] + L1 * Math.sin(ang)]
}

export default function Spider() {
  const wrapRef = useRef(null)
  const bodyRef = useRef(null)
  const threadSvgRef = useRef(null)
  const threadRef = useRef(null)
  const legEls = useRef([])

  useEffect(() => {
    const wrap = wrapRef.current
    const body = bodyRef.current
    const threadSvg = threadSvgRef.current
    const thread = threadRef.current
    if (!wrap || !body || !thread) return undefined

    let W = window.innerWidth
    let H = window.innerHeight
    let S = W < 640 ? 0.85 : 1
    const sizeAll = () => {
      W = window.innerWidth
      H = window.innerHeight
      S = W < 640 ? 0.85 : 1
      wrap.style.width = `${80 * S}px`
      wrap.style.height = `${80 * S}px`
      threadSvg.setAttribute('viewBox', `0 0 ${W} ${H}`)
    }
    sizeAll()

    const st = {
      x: W * 0.12,
      y: H * 0.5,
      h: 0,
      tx: 0,
      ty: 0,
      vx: 0,
      vy: 0,
      mode: 'pause',
      t: 0,
      dur: 1.2,
      anchorX: 0,
      startY: 0,
      dropY: 0,
      edgeH: 0,
      dartTx: 0,
      dartTy: 0,
      lastY: window.scrollY,
      fastAt: -1e9,
      lastPoke: -1e9,
      pointerX: null,
      pointerY: null,
      pendingLower: false,
    }

    const toWorld = (lx, ly) => ({
      x: st.x + (Math.cos(st.h) * lx - Math.sin(st.h) * ly) * S,
      y: st.y + (Math.sin(st.h) * lx + Math.cos(st.h) * ly) * S,
    })
    const toLocal = (wx, wy) => {
      const dx = (wx - st.x) / S
      const dy = (wy - st.y) / S
      return {
        x: Math.cos(st.h) * dx + Math.sin(st.h) * dy,
        y: -Math.sin(st.h) * dx + Math.cos(st.h) * dy,
      }
    }

    const enter = (mode, dur = 0) => {
      st.mode = mode
      st.t = 0
      st.dur = dur
    }

    const bounds = () => {
      st.x = clamp(st.x, 16, W - 16)
      st.y = clamp(st.y, TOP_MIN, H - 16)
    }

    const pickWander = () => {
      if (Math.random() < 0.3) {
        st.tx = rand(24, W - 24)
        st.ty = rand(TOP_MIN, H - 24)
      } else {
        const side = Math.floor(Math.random() * 4)
        if (side === 0) { st.tx = 16; st.ty = rand(TOP_MIN, H - 16) }
        else if (side === 1) { st.tx = W - 16; st.ty = rand(TOP_MIN, H - 16) }
        else if (side === 2) { st.ty = TOP_MIN; st.tx = rand(16, W - 16) }
        else { st.ty = H - 16; st.tx = rand(16, W - 16) }
      }
      enter('wander')
    }

    const nearestEdge = () => {
      const dL = st.x
      const dR = W - st.x
      const dT = st.y - TOP_MIN
      const dB = H - st.y
      const m = Math.min(dL, dR, dT, dB)
      if (m === dL) { st.tx = 16; st.ty = st.y; st.edgeH = Math.PI / 2 }
      else if (m === dR) { st.tx = W - 16; st.ty = st.y; st.edgeH = Math.PI / 2 }
      else if (m === dT) { st.tx = st.x; st.ty = TOP_MIN; st.edgeH = 0 }
      else { st.tx = st.x; st.ty = H - 16; st.edgeH = 0 }
    }

    // move along heading toward target; returns true on arrival
    const moveToward = (dt, speed, turn) => {
      const desired = Math.atan2(st.ty - st.y, st.tx - st.x)
      const diff = angleDiff(desired, st.h)
      st.h += clamp(diff, -turn * dt, turn * dt)
      const dist = Math.hypot(st.tx - st.x, st.ty - st.y)
      const step = speed * dt
      if (dist <= step + 4) {
        st.vx = (st.tx - st.x) / Math.max(dt, 0.001)
        st.vy = (st.ty - st.y) / Math.max(dt, 0.001)
        st.x = st.tx
        st.y = st.ty
        return true
      }
      st.x += Math.cos(st.h) * step
      st.y += Math.sin(st.h) * step
      st.vx = Math.cos(st.h) * speed
      st.vy = Math.sin(st.h) * speed
      return false
    }

    // legs: walk gait with planted feet in world space
    const stepLegs = (dt, thresh, dur, max) => {
      const counts = [0, 0]
      for (const l of LEGS) if (l.step) counts[l.group]++
      for (const l of LEGS) {
        const rest = toWorld(l.hip[0] + l.dir[0] * REACH, l.hip[1] + l.dir[1] * REACH)
        if (!l.foot) l.foot = rest
        if (l.step) {
          l.step.t = Math.min(1, l.step.t + dt / l.step.dur)
          const e = easeInOut(l.step.t)
          l.foot = {
            x: l.step.from.x + (l.step.to.x - l.step.from.x) * e,
            y: l.step.from.y + (l.step.to.y - l.step.from.y) * e,
          }
          if (l.step.t >= 1) {
            l.step = null
            counts[l.group]--
          }
        } else if (counts[l.group] < max && Math.hypot(l.foot.x - rest.x, l.foot.y - rest.y) > thresh * S) {
          counts[l.group]++
          l.step = {
            from: { ...l.foot },
            to: { x: rest.x + st.vx * 0.12, y: rest.y + st.vy * 0.12 },
            t: 0,
            dur,
          }
        }
      }
    }

    // direct poses (cling spread, thread curl)
    const poseLegs = (fn) => {
      LEGS.forEach((l, i) => {
        l.step = null
        l.foot = fn(l, i)
      })
    }

    let raf = 0
    let last = performance.now()

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      st.t += dt

      // scroll: fast scrolling sends the spider to the nearest edge
      const sy = window.scrollY
      const dy = Math.abs(sy - st.lastY)
      st.lastY = sy
      if (dy > 28) st.fastAt = now
      const scrollFast = now - st.fastAt < 120
      const scrollIdle = now - st.fastAt > 900

      if (scrollFast && st.mode !== 'scurry' && st.mode !== 'cling' && st.mode !== 'dart') {
        nearestEdge()
        enter('scurry')
      }

      switch (st.mode) {
        case 'wander': {
          if (moveToward(dt, 26, 4)) {
            if (Math.random() < 0.2) {
              st.pendingLower = true
              enter('pause', rand(0.6, 1.4))
            } else {
              enter('pause', rand(0.8, 2.2))
            }
          }
          break
        }
        case 'pause': {
          if (st.t >= st.dur) {
            if (st.pendingLower) {
              st.pendingLower = false
              st.anchorX = st.x
              st.startY = st.y
              st.dropY = Math.min(H - 30, st.y + rand(70, 150))
              enter('lower', 0.9)
            } else {
              pickWander()
            }
          }
          break
        }
        case 'scurry': {
          if (moveToward(dt, 270, 10)) {
            st.h = st.edgeH
            enter('cling')
          }
          break
        }
        case 'cling': {
          st.h += clamp(angleDiff(st.edgeH, st.h), -6 * dt, 6 * dt)
          if (scrollIdle && st.t > 0.5) enter('pause', 0.5)
          break
        }
        case 'dart': {
          if (moveToward(dt, 340, 12) || st.t > 0.55) {
            if (Math.random() < 0.35) {
              st.anchorX = st.x
              st.startY = st.y
              st.dropY = Math.min(H - 30, st.y + rand(70, 150))
              enter('lower', 0.9)
            } else {
              enter('pause', rand(0.6, 1.2))
            }
          }
          break
        }
        case 'lower': {
          const e = easeInOut(clamp(st.t / st.dur, 0, 1))
          st.x = st.anchorX
          st.y = st.startY + (st.dropY - st.startY) * e
          st.h += clamp(angleDiff(Math.PI / 2, st.h), -8 * dt, 8 * dt)
          if (st.t >= st.dur) enter('hang', rand(3.5, 6))
          break
        }
        case 'hang': {
          st.x = st.anchorX + Math.sin(st.t * 1.4) * 2
          st.y = st.dropY + Math.sin(st.t * 2.6) * 5
          st.h = Math.PI / 2 + Math.sin(st.t * 1.4) * 0.12
          if (st.t >= st.dur) enter('climb')
          break
        }
        case 'climb': {
          st.x = st.anchorX
          st.y -= 110 * dt
          st.h = Math.PI / 2
          if (st.y <= TOP_MIN) {
            st.y = TOP_MIN
            enter('pause', 0.6)
          }
          break
        }
        default:
          break
      }

      bounds()

      const threadOn = st.mode === 'lower' || st.mode === 'hang' || st.mode === 'climb'
      if (st.mode === 'cling') {
        poseLegs((l, i) => toWorld(l.hip[0] + l.dir[0] * REACH * 1.2, l.hip[1] + l.dir[1] * REACH * 1.2 + Math.sin(now / 180 + i) * 0.6))
      } else if (threadOn) {
        poseLegs((l, i) => {
          const wig = Math.sin(now / 140 + i * 0.9) * 1.6
          return toWorld(l.hip[0] + l.dir[0] * 11, l.hip[1] + l.dir[1] * 11 + wig * l.s)
        })
      } else {
        const idleSpeed = st.mode === 'pause' ? 0 : 1
        stepLegs(dt, idleSpeed ? 10 : 12, st.mode === 'dart' ? 0.09 : 0.14, 2)
      }

      // render: transform on wrapper, rotation on body, leg path updates
      wrap.style.transform = `translate3d(${(st.x - 40 * S).toFixed(1)}px, ${(st.y - 40 * S + (threadOn ? 0 : Math.sin(now / 400) * 0.6)).toFixed(1)}px, 0)`
      body.setAttribute('transform', `rotate(${((st.h * 180) / Math.PI).toFixed(1)})`)
      LEGS.forEach((l, i) => {
        const el = legEls.current[i]
        if (!el) return
        const fl = toLocal(l.foot.x, l.foot.y)
        const lift = l.step ? Math.sin(Math.PI * l.step.t) * 0.35 : 0
        const k = knee(l.hip, fl, l.s, lift)
        el.setAttribute('d', `M${l.hip[0]} ${l.hip[1]}L${k[0].toFixed(2)} ${k[1].toFixed(2)}L${fl.x.toFixed(2)} ${fl.y.toFixed(2)}`)
      })
      if (threadOn) {
        threadSvg.style.opacity = '1'
        thread.setAttribute('x1', st.anchorX)
        thread.setAttribute('y1', 0)
        thread.setAttribute('x2', st.x)
        thread.setAttribute('y2', st.y - 7 * S)
      } else {
        threadSvg.style.opacity = '0'
      }

      raf = requestAnimationFrame(frame)
    }

    // startle: pointer or touch near the spider
    const poke = (px, py) => {
      const now = performance.now()
      if (now - st.lastPoke < 1400) return
      if (st.mode === 'dart') return
      if (Math.hypot(px - st.x, py - st.y) > 58 * S) return
      st.lastPoke = now
      let dx = st.x - px
      let dy = st.y - py
      const d = Math.hypot(dx, dy) || 1
      dx /= d
      dy /= d
      st.dartTx = clamp(st.x + dx * 170 * S, 16, W - 16)
      st.dartTy = clamp(st.y + dy * 170 * S, TOP_MIN, H - 16)
      st.tx = st.dartTx
      st.ty = st.dartTy
      st.pendingLower = false
      enter('dart')
    }

    const onPointerDown = (e) => poke(e.clientX, e.clientY)
    const onPointerMove = (e) => poke(e.clientX, e.clientY)
    const onResize = () => sizeAll()

    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('resize', onResize)

    // start on the page after a short pause
    enter('pause', 1.2)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 35, pointerEvents: 'none', overflow: 'hidden' }}
    >
      <svg
        ref={threadSvgRef}
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0, opacity: 0 }}
      >
        <line ref={threadRef} stroke="rgba(30,41,59,0.5)" strokeWidth="1" />
      </svg>

      <div
        ref={wrapRef}
        style={{ position: 'absolute', left: 0, top: 0, willChange: 'transform', contain: 'layout style' }}
      >
        <svg viewBox="-40 -40 80 80" width="100%" height="100%" style={{ overflow: 'visible' }}>
          <g ref={bodyRef}>
            {LEGS.map((_, i) => (
              <path
                key={i}
                ref={(el) => (legEls.current[i] = el)}
                d="M0 0L0 0L0 0"
                fill="none"
                stroke="#2b2f36"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            <ellipse cx="-9" cy="0" rx="10" ry="8" fill="#2b2f36" />
            <ellipse cx="-12.5" cy="-3" rx="3.4" ry="1.8" fill="rgba(255,255,255,0.16)" />
            <circle cx="-9" cy="0" r="2.2" fill="#2dd4bf" opacity="0.85" />
            <circle cx="8" cy="0" r="7" fill="#353b45" />
            <circle cx="11" cy="-2.9" r="2.3" fill="#2dd4bf" />
            <circle cx="11" cy="2.9" r="2.3" fill="#2dd4bf" />
            <circle cx="11.7" cy="-3.4" r="0.8" fill="#ffffff" />
            <circle cx="11.7" cy="2.4" r="0.8" fill="#ffffff" />
          </g>
        </svg>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 40,
            height: 40,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'auto',
            cursor: 'pointer',
            borderRadius: '50%',
          }}
          onPointerDown={() => {}}
        />
      </div>
    </div>
  )
}
