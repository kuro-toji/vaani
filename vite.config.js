import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      // Proxy /api/* to local Express server if it's running.
      // If the server is not running, frontend falls back to direct Gemini API calls.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Don't throw if backend is down — let the fetch fail gracefully
        configure: (proxy) => {
          proxy.on('error', () => {});
        },
      },
    },
  },
})
