import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: { outDir: 'dist' },
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