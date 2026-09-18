import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.DEV_API_PROXY_TARGET || 'https://financas-casal-2026-gem.vercel.app'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    build: {
      outDir: 'dist',
      target: 'es2020',
      sourcemap: false,
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
      strictPort: true,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
