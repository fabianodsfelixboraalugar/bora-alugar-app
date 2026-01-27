
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Shim para process.env caso libs antigas o utilizem
    'process.env': {}
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    // Garante que arquivos na pasta public não sejam movidos para assets
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Garante nomes de arquivos consistentes para o bundle
        manualChunks: undefined
      }
    }
  },
  publicDir: 'public'
})
