import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
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
        project: './project.html',
      },
    },
  },
})
