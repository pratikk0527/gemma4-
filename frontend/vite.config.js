import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Expose on all network interfaces so dev-tunnel and LAN devices can reach it
    host: '0.0.0.0',
    proxy: {
      // /api/* → FastAPI backend on :8000
      // NOTE: When using dev tunnels, the frontend will call the backend tunnel
      //       URL directly (set via ⚙️ button in the app). This proxy is for
      //       local-only usage (localhost:5173).
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Set a long proxy timeout so slow LM Studio inference (60-120s) doesn't
        // get cut off when running locally through the proxy
        timeout: 360000,          // 6 minutes
        proxyTimeout: 360000,     // 6 minutes
      },
    },
  },
})
