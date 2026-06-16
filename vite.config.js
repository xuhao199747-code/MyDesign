import { defineConfig } from 'vite'
import { readFileSync, writeFileSync } from 'fs'

export default defineConfig({
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
