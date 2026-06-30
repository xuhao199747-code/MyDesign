import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  base: './',
  assetsInclude: ['**/*.glb'],
  plugins: [react({ fastRefresh: false }), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.js', '.jsx', '.json'],
  },
  publicDir: 'public',
	  build: {
	    modulePreload: false,
	    cssMinify: false,
    outDir: 'dist',
    emptyOutDir: false,
    manifest: 'project-manifest.json',
    rollupOptions: {
      input: {
        projectPage: path.resolve(__dirname, 'src/project-page-entry.jsx'),
      },
	      output: {
	        manualChunks(id) {
	          if (
	            id.includes('\0vite') ||
	            id.includes('vite/preload') ||
	            id.includes('modulepreload') ||
	            id.includes('preload-helper')
	          ) {
	            return 'vite-preload';
	          }
	          if (!id.includes('node_modules')) return undefined;
	          if (
	            id.includes('@react-three') ||
	            id.includes('@dimforge') ||
	            id.includes('@monogrid/gainmap') ||
	            id.includes('meshline') ||
	            id.includes('/three/') ||
	            id.includes('\\three\\') ||
	            id.includes('three-stdlib')
	          ) {
	            return 'vendor-three';
	          }
	          if (id.includes('react-dom')) return 'vendor-react-dom';
          if (
            id.includes('react/jsx-runtime') ||
            id.includes('\\react\\') ||
            id.includes('/react/')
          ) {
            return 'vendor-react';
          }
          return 'vendor';
        },
      },
    },
  },
})
