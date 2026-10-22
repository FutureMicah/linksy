// Product / category image frame.
// Real photo: set `image: '/img/<file>.webp'` on the listing (seed.js or admin image field).
// Until then it renders procedural key art (ArtSVG), so no card is ever bare.
import { memo } from 'react'
import { ArtSVG, artKey } from './ArtSVG.jsx'

function Cover({ listing, category, className = '', alt = '', eager = false }) {
  const cat = category || listing?.category
  const src = listing?.image
  if (src) {
    return (
      <div className={`cover relative ${className}`}>
        <img
          className="cover-photo"
          src={src}
          alt={alt || listing?.title || ''}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          width="800"
          height="800"
        />
      </div>
    )
  }
  return (
    <div className={`cover relative ${className}`} role="img" aria-label={alt || listing?.title || cat || 'art'}>
      <ArtSVG k={listing ? artKey(listing) : cat || 'gaming'} />
    </div>
  )
}

export default memo(Cover)
