import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('error', reject);
    req.on('end', () => {
      const rawBody = Buffer.concat(chunks).toString('utf8');
      if (!rawBody) {
        resolve(undefined);
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch {
        resolve(rawBody);
      }
    });
  });
}

function localApiRoutesPlugin() {
  return {
    name: 'local-api-routes',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = String(req.url || '').split('?')[0];
        if (!pathname.startsWith('/api/')) {
          next();
          return;
        }

        const routeName = pathname.slice('/api/'.length);
        const routePath = path.resolve(__dirname, 'api', `${routeName}.js`);

        try {
          req.body = await readRequestBody(req);
          delete require.cache[require.resolve(routePath)];
          const handler = require(routePath);
          await handler(req, res);
        } catch (error) {
          res.statusCode = error.statusCode || 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: error.message || 'local_api_failed' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return {
  base: './',
  assetsInclude: ['**/*.glb'],
  plugins: [localApiRoutesPlugin(), react({ fastRefresh: false }), tailwindcss()],
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
	        admin: path.resolve(__dirname, 'admin.html'),
	        navWechatLanyard: path.resolve(__dirname, 'src/nav-wechat-lanyard-entry.jsx'),
	        portfolioBounceCards: path.resolve(__dirname, 'src/portfolio-bounce-cards.jsx'),
	        ribbonsEntry: path.resolve(__dirname, 'src/ribbons-entry.jsx'),
	        chatWidget: path.resolve(__dirname, 'src/chat/chat-entry.jsx'),
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
  };
})
