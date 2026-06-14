import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Use '/AQL-APP/' base path only if deploying to GitHub Pages (running in GitHub Actions)
  base: process.env.GITHUB_ACTIONS ? '/AQL-APP/' : '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})

