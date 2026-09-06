import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * The dev server proxies API, media, and Django admin traffic to Django.
 * Notice: We proxy exact `/admin/` with trailing slash so frontend routes like
 * `/dashboard`, `/admin-dashboard`, `/admin-login` remain on the Vite React router!
 */
const BACKEND = process.env.VITE_BACKEND_ORIGIN ?? 'http://127.0.0.1:8017'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      '/media': { target: BACKEND, changeOrigin: true },
      '/static': { target: BACKEND, changeOrigin: true },
      '^/admin/': { target: BACKEND, changeOrigin: true },
    },
  },
  build: { outDir: 'dist', sourcemap: true },
})
