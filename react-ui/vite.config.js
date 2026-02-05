import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../ui',
    emptyOutDir: true, // Limpa o diretório ../ui antes de construir
    lib: {
      entry: path.resolve(__dirname, 'src/main.jsx'),
      name: 'MinhaUI',
      fileName: () => 'index.js', // Força o nome do arquivo para index.js
      formats: ['iife'] // Formato IIFE é ideal para content scripts (autocontido)
    },
    rollupOptions: {
      output: {
        // Garante que o CSS (se houver extração) tenha nome fixo, embora estejamos usando ?inline
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'index.css';
          return assetInfo.name;
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"' // Necessário para React em build de produção
  }
})