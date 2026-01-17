import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'

// Load custom configuration from environment variables
const customHost = process.env.VITE_CUSTOM_HOST
const customHosts = process.env.VITE_ALLOWED_HOSTS?.split(',').map(h => h.trim()).filter(Boolean) || []

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
    // Allow all hosts by default for flexibility with Tailscale, local IPs, etc.
    // Override with VITE_ALLOWED_HOSTS env var for security in production
    allowedHosts: customHosts.length > 0 ? customHosts : true,
    watch: {
      usePolling: true, // Enable polling for file changes (required for Docker)
    },
    hmr: {
      // Use custom host for HMR if specified (e.g., Tailscale hostname)
      host: customHost || 'localhost',
    },
  },
})
