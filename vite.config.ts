
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Garante que a API_KEY seja injetada no código do navegador
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || '')
    },
    optimizeDeps: {
      // Força o Vite a preparar o Gemini SDK para evitar erro de resolução
      include: ['@google/genai']
    },
    build: {
      outDir: 'dist',
      target: 'esnext',
      minify: 'esbuild',
    },
    server: {
      host: true,
      port: 5173,
      // Limpa o cache de dependências na inicialização se necessário
      force: true
    }
  }
})
