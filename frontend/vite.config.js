import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite acesso externo (necessário para Docker)
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://api:3000', // Usa nome do serviço Docker
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
