# accountplug

A dark, motion-heavy marketplace for gaming accounts, social media accounts and redeemable gift cards. Prices are in Naira (₦) with a USD equivalent. Checkout is a manual bank transfer followed by a WhatsApp proof link.

## What's inside

- Three categories: gaming accounts, social accounts, gift cards
- Search, in-stock filter, max-price filter, sort (newest, price up, price down)
- Product pages with Naira price, USD equivalent, specs and related listings
- Cart with quantity controls and stock limits
- Checkout that reserves stock the moment an order is placed
- Order page with exact transfer amount, narration (order reference) and a prefilled WhatsApp proof link
- PIN-gated admin at /admin: add, edit, delete, mark sold and restock listings, and move orders through awaiting transfer, paid, delivered, cancelled (cancelling returns the reserved stock)

## Look and feel

- Editorial serif display (Cormorant Garamond) with a clean sans body (Inter), loaded from Google Fonts
- Dark near-black with a gold accent, glass panels, soft glows, film grain and a slow light-leak in the hero
- Shimmer sweep on product cards, skeleton placeholders while loading

## Installable app (PWA)

- manifest.webmanifest: name, icons (192, 512 and maskable 512), standalone display, theme colors
- sw.js: caches the app shell and hashed build assets, so the app opens offline (listings are kept in the browser)
- Install prompt on Android and desktop after a short delay, with an add-to-home-screen hint on iOS
- The service worker only registers in production builds (npm run build, then preview or deploy)

## Motion and performance

- GSAP with ScrollTrigger: scroll reveals, staggered hero entrance, parallax orbs, animated counters, page-in transitions
- @gsap/react hooks for clean setup and teardown
- Lenis smooth scrolling, driven from GSAP's ticker so scroll triggers stay in sync
- Magnetic buttons and 3D tilt cards on fine pointers only (desktop)
- Route-level code splitting: admin, checkout, cart, product and order pages load on demand
- Mobile-first layout, down to 360px
- prefers-reduced-motion is respected: animations, shimmer, light-leak and smooth scroll are turned off

## Run it

Install dependencies, copy the example env file to .env.local, fill in your bank details and admin PIN, then start the dev server. Use the build script for production.

## Config (.env.local)

- VITE_ADMIN_PIN: PIN for /admin
- VITE_BANK_NAME, VITE_BANK_ACCOUNT_NAME, VITE_BANK_ACCOUNT_NUMBER: shown at checkout
- VITE_USD_RATE: naira per dollar used for the USD equivalent
- VITE_SUPPORT_WHATSAPP: international number for the proof link, digits only (for example 2348012345678)

## Data

Demo listings are seeded in src/data/seed.js. Listings and orders are saved to the browser (localStorage) by default. supabase/schema.sql is included for moving the data to Supabase when you're ready.

## Stack

React 19, Vite, Tailwind CSS 4, React Router 7, Zustand, GSAP, Lenis, service worker + web app manifest.
