// Review helpers. Stored reviews (from the buyer review form) are merged with seed reviews.
export function publicName(name = '') {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return 'Verified buyer'
  const first = parts[0]
  const last = parts[1] ? `${parts[1][0].toUpperCase()}.` : ''
  return last ? `${first} ${last}` : first
}

export function averageRating(reviews) {
  if (!reviews.length) return 0
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
}

// Reviews for one listing: stored reviews first (newest), then seed reviews when enabled.
export function reviewsForListing(listingId, seed, stored, includeSeed) {
  const storedForListing = (stored || [])
    .filter((r) => r.listing_ids?.includes(listingId))
    .map((r) => ({ name: r.author, rating: r.rating, comment: r.comment, date: r.created_at.slice(0, 10) }))
  const seedForListing = includeSeed ? (seed[listingId] || []) : []
  return [...storedForListing, ...seedForListing]
}
