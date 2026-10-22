// Central config. Values come from .env.local (see .env.example).
const env = import.meta.env

export const CONFIG = {
  adminPin: env.VITE_ADMIN_PIN || 'changeme-1234',
  bank: {
    name: env.VITE_BANK_NAME || 'Your Bank Name',
    accountName: env.VITE_BANK_ACCOUNT_NAME || 'Your Business Name',
    accountNumber: env.VITE_BANK_ACCOUNT_NUMBER || '0000000000',
  },
  usdRate: Number(env.VITE_USD_RATE) || 1550,
  supportWhatsapp: env.VITE_SUPPORT_WHATSAPP || '2340000000000',
  // Seller trust stats shown on the Verified Seller badge. Replace with real numbers before going live.
  trust: { positive: '99.4%', orders: '140+' },
  // Demo reviews from src/data/reviews.js. Turn off before taking real orders.
  showSeedReviews: true,
}

export const CATEGORIES = [
  { id: 'gaming', label: 'Gaming Accounts', short: 'Gaming', icon: '🎮' },
  { id: 'social', label: 'Social Accounts', short: 'Social', icon: '📱' },
  { id: 'giftcards', label: 'Gift Cards', short: 'Gift Cards', icon: '🎁' },
]

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id)
