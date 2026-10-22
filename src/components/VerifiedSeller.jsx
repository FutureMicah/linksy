import { CONFIG } from '../config.js'

// Verified Seller badge: checkmark plus trust stats. compact = card-size variant.
export default function VerifiedSeller({ compact = false, className = '' }) {
  const { positive, orders } = CONFIG.trust
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-cyan/25 bg-cyan/10 text-cyan font-medium ${
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      } ${className}`}
      title={`Verified seller: ${positive} positive, ${orders} completed orders`}
    >
      <svg viewBox="0 0 24 24" className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} fill="currentColor" aria-hidden="true">
        <path d="M12 2.5l2.6 2 3.2-.2 1 3 2.6 1.8-1 3 1 3-2.6 1.8-1 3-3.2-.2-2.6 2-2.6-2-3.2.2-1-3-2.6-1.8 1-3-1-3 2.6-1.8 1-3 3.2.2 2.6-2z" />
        <path d="M8.2 12.2l2.4 2.4 5-5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verified Seller
      {!compact && <span className="text-muted font-normal">· {positive} positive · {orders} orders</span>}
    </span>
  )
}
