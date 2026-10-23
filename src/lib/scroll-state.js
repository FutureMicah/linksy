// shared handle to the smooth scroller. lib/lenis.js fills it in after the decorative stage loads,
// so the eager shell never imports lenis.
export const scroll = { lenis: null }
export const getLenis = () => scroll.lenis
