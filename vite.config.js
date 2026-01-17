import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  server: {
    host: '0.0.0.0', // Allow external connections (required for Docker)
    port: 11248,     // Default development port
    strictPort: true, // Exit if port is already in use
    watch: {
      usePolling: true, // Enable polling for file changes (required for Docker)
    },
    hmr: {
      host: 'localhost', // HMR host for browser WebSocket connection
    },
  },
})
