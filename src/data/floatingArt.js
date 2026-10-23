// Floating art manifest. Every page picks FLOATING_ART_COUNT.min..max entries at random
// from this list (so each route feels different). To add new art: drop the file in
// public/img/ and add a line here. No code changes needed.
//
// src    : path under /public (webp/png/jpg)
// size   : chip size in px, keep within 44..90
// depth  : 0..1, higher = closer to the viewer (bigger parallax, more opacity)
// shape  : 'round' (rounded-2xl) | 'hex' (hexagon clip) | 'diag' (diagonal-cut clip)

export const FLOATING_ART = [
  { src: '/img/fortnite-og-120-skins.webp', size: 80, depth: 0.9, shape: 'round' },
  { src: '/img/free-fire-diamond-royale.webp', size: 56, depth: 0.5, shape: 'hex' },
  { src: '/img/cod-mobile-legendary-prestige.webp', size: 46, depth: 0.35, shape: 'diag' },
  { src: '/img/pubg-mobile-conqueror.webp', size: 70, depth: 0.7, shape: 'round' },
  { src: '/img/ea-fc-26-ultimate-team-account.webp', size: 50, depth: 0.45, shape: 'hex' },
  { src: '/img/steam-account-40-games.webp', size: 64, depth: 0.8, shape: 'diag' },
  { src: '/img/valorant-account-sold-example.webp', size: 44, depth: 0.3, shape: 'round' },
  { src: '/img/youtube-10k-monetized.webp', size: 88, depth: 0.6, shape: 'diag' },
]

export const FLOATING_ART_COUNT = { min: 5, max: 7 }
