import { useEffect, useState } from 'react'
import { formatRemaining, isInspectionOver, inspectionEndsAt } from '../lib/escrow.js'

// Steps: 1 funds held, 2 details delivered, 3 inspection window, 4 completed / funds released.
export function escrowSteps(esc) {
  const s = esc.state
  const funded = ['held', 'delivered', 'released', 'disputed', 'refunded'].includes(s)
  const delivered = ['delivered', 'released', 'disputed'].includes(s) || (s === 'refunded' && !!esc.delivered_at)
  const released = s === 'released'
  return [
    { key: 'funded', title: 'Funds in escrow', hint: 'Payment verified by Linksy', done: funded },
    { key: 'delivered', title: 'Account / card details delivered', hint: 'Sent to your WhatsApp after payment', done: delivered },
    { key: 'inspect', title: 'Buyer inspection window', hint: '24h to check the account or code', done: released, active: delivered && !released && s !== 'disputed' },
    { key: 'complete', title: 'Completed', hint: 'Funds released to seller', done: released },
  ]
}

export function useCountdown(endsAt) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!endsAt) return undefined
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [endsAt])
  return endsAt ? Math.max(0, endsAt - now) : null
}

export default function EscrowTimeline({ esc }) {
  const steps = escrowSteps(esc)
  const endsAt = inspectionEndsAt(esc)
  const remaining = useCountdown(endsAt)
  const windowOver = isInspectionOver(esc)

  return (
    <ol className="flex flex-col gap-0" aria-label="Escrow progress">
      {steps.map((st, i) => {
        const last = i === steps.length - 1
        return (
          <li key={st.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold border ${
                  st.done
                    ? 'bg-lime border-lime text-white'
                    : st.active
                      ? 'border-cyan text-cyan bg-cyan/10'
                      : 'border-line text-muted bg-white'
                }`}
              >
                {st.done ? '✓' : i + 1}
              </span>
              {!last && <span className={`w-px flex-1 min-h-6 ${st.done ? 'bg-lime/50' : 'bg-line'}`} />}
            </div>
            <div className="pb-5 min-w-0">
              <div className={`text-sm font-medium ${st.done || st.active ? 'text-bone' : 'text-muted'}`}>{st.title}</div>
              <div className="text-xs text-muted">{st.hint}</div>
              {st.key === 'inspect' && st.active && endsAt && (
                <div className="mt-1.5 inline-flex items-center gap-2 rounded-full bg-cyan/10 text-cyan text-xs font-medium px-3 py-1">
                  {windowOver ? 'Window closed' : `Time left ${formatRemaining(remaining)}`}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
