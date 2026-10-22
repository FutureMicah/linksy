// Platform logo lookup. Logos are vendored in public/logos/ (simple-icons SVGs, plus local marks for Xbox, CODM, Free Fire, Amazon).
export const PLATFORMS = [
  { key: /fortnite/i, name: 'Fortnite', logo: 'fortnite', color: '#7b3ff2' },
  { key: /codm|call of duty/i, name: 'CODM', logo: 'codm', color: '#2e7d32' },
  { key: /pubg/i, name: 'PUBG', logo: 'pubg', color: '#f2a900' },
  { key: /ea fc|fc 26|ea sports/i, name: 'EA FC', logo: 'ea', color: '#1d6bf3' },
  { key: /free fire/i, name: 'Free Fire', logo: 'freefire', color: '#ff6a00' },
  { key: /steam/i, name: 'Steam', logo: 'steam', color: '#1b2838' },
  { key: /playstation|ps4|ps5/i, name: 'PlayStation', logo: 'playstation', color: '#003791' },
  { key: /xbox/i, name: 'Xbox', logo: 'xbox', color: '#107c10' },
  { key: /instagram/i, name: 'Instagram', logo: 'instagram', color: '#e1306c' },
  { key: /tiktok/i, name: 'TikTok', logo: 'tiktok', color: '#111111' },
  { key: /facebook/i, name: 'Facebook', logo: 'facebook', color: '#1877f2' },
  { key: /youtube/i, name: 'YouTube', logo: 'youtube', color: '#ff0000' },
  { key: /x \(twitter\)|twitter|\bx\b/i, name: 'X', logo: 'x', color: '#111111' },
  { key: /amazon/i, name: 'Amazon', logo: 'amazon', color: '#ff9900' },
  { key: /apple|itunes/i, name: 'Apple', logo: 'apple', color: '#555555' },
  { key: /google play/i, name: 'Google Play', logo: 'googleplay', color: '#01875f' },
]

export function platformFor(listing) {
  const t = listing?.title || ''
  return PLATFORMS.find((p) => p.key.test(t)) || null
}
