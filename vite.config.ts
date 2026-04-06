import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'icons': ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api/gastos/fixos': {
        target: 'https://financas-casal-2026-gem.vercel.app',
        changeOrigin: true,
        secure: true,
      },
      '/api/gastos/variaveis': {
        target: 'https://financas-casal-2026-gem.vercel.app',
        changeOrigin: true,
        secure: true,
      },
      '/api': {
        target: 'https://financas-casal-2026-gem.vercel.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
