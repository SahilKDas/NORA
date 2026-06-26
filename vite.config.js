import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4174,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
