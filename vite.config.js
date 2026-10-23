import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development the frontend calls /api/v1 on its own origin and Vite forwards it to the
    // Express API, so no CORS setup is needed locally. Override with VITE_API_URL if required.
    proxy: {
      '/api': { target: process.env.VERIFYIT_API_PROXY ?? 'http://localhost:4000', changeOrigin: false },
    },
  },
})
