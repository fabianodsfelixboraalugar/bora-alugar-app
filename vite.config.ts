
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          genai: ['@google/genai']
        }
      }
    }
  },
  server: {
    host: true,
    port: 3000
  },
  define: {
    // Garante compatibilidade de variáveis de ambiente process.env legadas se necessário
    'process.env': {}
  }
})
