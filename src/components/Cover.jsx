// Product / category image frame.
// To add a real photo: set `image: '/img/<file>.webp'` on the listing in src/data/seed.js (or the admin image field).
// Until then it renders a light gradient tile with a subtle category glyph.
import { memo } from 'react'

const GLYPH = {
  gaming: (
    <path d="M7 9h10a4 4 0 0 1 3.9 4.9l-.9 4.1a2 2 0 0 1-3.6.7L14.6 16h-5.2l-1.8 2.7a2 2 0 0 1-3.6-.7l-.9-4.1A4 4 0 0 1 7 9Zm-2 4h3m-1.5-1.5v3M15 12.5h.01M17 14.5h.01" />
  ),
  social: <path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm4 15h.01" />,
  giftcards: <path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-2-3-5-3-5-1s3 1 5 1Zm0 0c2-3 5-3 5-1s-3 1-5 1Z" />,
}

function Cover({ listing, category, className = '', alt = '', eager = false }) {
  const cat = category || listing?.category
  const src = listing?.image
  return (
    <div className={`cover cover-grid grid place-items-center ${className}`}>
      {src ? (
        <img
          className="cover-photo"
          src={src}
          alt={alt || listing?.title || ''}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          width="800"
          height="800"
        />
      ) : (
        <svg className="cover-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {GLYPH[cat] || GLYPH.gaming}
        </svg>
      )}
    </div>
  )
}

export default memo(Cover)
