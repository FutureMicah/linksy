import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// build-only: hint the browser to fetch the storefront chunk in parallel with the entry (hidden behind the gamepad loader)
const preloadHome = {
  name: 'preload-home-chunk',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(html, ctx) {
      const f = Object.keys(ctx.bundle || {}).find((k) => /^assets\/Home-.*\.js$/.test(k))
      if (!f) return html
      return html.replace('</head>', `    <link rel="modulepreload" crossorigin href="/${f}" />\n  </head>`)
    },
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), preloadHome],
})
