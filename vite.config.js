import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Base path matching your GitHub Pages repository: https://github.com/sainiboyynr-ux/AQL-APP
  base: '/AQL-APP/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})

