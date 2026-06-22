import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  base: './',
  plugins: [react({ fastRefresh: false }), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.js', '.jsx', '.json']
  },
  publicDir: 'public',
  build: {
    cssMinify: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@animateicons/react')) return 'vendor-animateicons';
          if (id.includes('react-dom')) return 'vendor-react-dom';
          if (id.includes('react/jsx-runtime') || id.includes('\\react\\') || id.includes('/react/')) {
            return 'vendor-react';
          }
          return 'vendor';
        },
      },
    },
  },
})
