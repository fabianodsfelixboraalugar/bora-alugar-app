import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Otimizações para mobile
    target: 'esnext',
    minify: 'esbuild',

    // ✅ AUMENTA O LIMITE DO AVISO DE CHUNK
    chunkSizeWarningLimit: 1200
  },
  server: {
    host: true
  }
})
