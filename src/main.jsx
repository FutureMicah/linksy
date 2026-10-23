import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import './styles/fx3d.css'
import './styles/holiday.css'
import { registerSW } from './lib/pwa.js'

// start fetching the storefront chunk right away (shares the module with the lazy route in App.jsx)
const homeChunk = import('./pages/Home.jsx')

// the splash holds until BOTH the Home chunk is loaded AND the app has mounted + painted (ReadyBeacon in App.jsx)
const appReady = new Promise((resolve) =>
  window.addEventListener('linksy:ready', resolve, { once: true }),
)

registerSW()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

Promise.all([homeChunk, appReady]).then(() => {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const s = document.getElementById('splash')
    if (!s) return
    s.classList.add('is-gone')
    setTimeout(() => s.remove(), 300)
  }))
})
