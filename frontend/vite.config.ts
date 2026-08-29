import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * The dev server proxies API and media traffic to Django so the browser sees a
 * single origin: no CORS pre-flights and the session cart cookie just works.
 */
const BACKEND = process.env.VITE_BACKEND_ORIGIN ?? 'http://127.0.0.1:8000'

const proxied = ['/api', '/media', '/static', '/admin']

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: Object.fromEntries(
      proxied.map((prefix) => [prefix, { target: BACKEND, changeOrigin: true }]),
    ),
  },
  build: { outDir: 'dist', sourcemap: true },
})
