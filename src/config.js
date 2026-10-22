// Central config. Values come from .env.local (see .env.example).
const env = import.meta.env

export const CONFIG = {
  adminPin: env.VITE_ADMIN_PIN || '#4Chinedu4#',
  bank: {
    name: env.VITE_BANK_NAME || 'Opay',
    accountName: env.VITE_BANK_ACCOUNT_NAME || 'future micah',
    accountNumber: env.VITE_BANK_ACCOUNT_NUMBER || '8135108929',
  },
  usdRate: Number(env.VITE_USD_RATE) || 1550,
  supportWhatsapp: env.VITE_SUPPORT_WHATSAPP || '2347072294831',
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
