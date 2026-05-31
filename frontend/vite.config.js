import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config with a development proxy so fetch('/api/v1/...') goes to backend at localhost:4000
// This prevents CORS/preflight issues when running the dev server.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})

