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
    extensions: ['.js', '.jsx', '.json']
  },
  publicDir: 'public',
	  build: {
	    modulePreload: false,
	    cssMinify: false,
	    rollupOptions: {
	      preserveEntrySignatures: 'exports-only',
	      input: {
	        index: path.resolve(__dirname, 'index.html'),
	        navWechatLanyard: path.resolve(__dirname, 'src/nav-wechat-lanyard-entry.jsx'),
	        portfolioBounceCards: path.resolve(__dirname, 'src/portfolio-bounce-cards.jsx'),
	        ribbonsEntry: path.resolve(__dirname, 'src/ribbons-entry.jsx'),
	        chatWidget: path.resolve(__dirname, 'src/chat-widget-entry.jsx'),
	      },
	      output: {
	        entryFileNames(chunkInfo) {
	          if (chunkInfo.name === 'navWechatLanyard') return 'assets/navWechatLanyard.js';
	          if (chunkInfo.name === 'portfolioBounceCards') return 'assets/portfolioBounceCards.js';
	          if (chunkInfo.name === 'ribbonsEntry') return 'assets/ribbonsEntry.js';
	          if (chunkInfo.name === 'chatWidget') return 'assets/chatWidget.js';
	          return 'assets/[name]-[hash].js';
	        },
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
          if (id.includes('react/jsx-runtime') || id.includes('\\react\\') || id.includes('/react/')) {
            return 'vendor-react';
          }
          return 'vendor';
        },
      },
    },
  },
})
