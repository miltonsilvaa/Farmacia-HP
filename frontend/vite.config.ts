import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    proxy: {
      '/auth': { target: 'http://localhost:3000', changeOrigin: true },
      '/usuarios': { target: 'http://localhost:3000', changeOrigin: true },
      '/familiares': { target: 'http://localhost:3000', changeOrigin: true },
      '/familia': { target: 'http://localhost:3000', changeOrigin: true },
      '/orcamentos': { target: 'http://localhost:3000', changeOrigin: true },
      '/produtos': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
})
