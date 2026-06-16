import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.json']
  },
  publicDir: 'public',
  build: {
    cssMinify: false,
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
})
