import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const API = process.env.VITE_DEV_API ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Same-origin in development: the browser only ever talks to Vite, which forwards to Spring Boot.
    proxy: {
      '/api': API,
      '/sitemap.xml': API,
      '/robots.txt': API,
    },
  },
  build: {
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
