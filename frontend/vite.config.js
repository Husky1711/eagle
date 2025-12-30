import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Preserve CORS headers from backend
            if (proxyRes.headers['access-control-allow-origin']) {
              res.setHeader('Access-Control-Allow-Origin', proxyRes.headers['access-control-allow-origin']);
            }
            if (proxyRes.headers['access-control-allow-methods']) {
              res.setHeader('Access-Control-Allow-Methods', proxyRes.headers['access-control-allow-methods']);
            }
            if (proxyRes.headers['access-control-allow-headers']) {
              res.setHeader('Access-Control-Allow-Headers', proxyRes.headers['access-control-allow-headers']);
            }
            // Preserve Content-Type for images
            if (proxyRes.headers['content-type']) {
              res.setHeader('Content-Type', proxyRes.headers['content-type']);
            }
            // Preserve Content-Length
            if (proxyRes.headers['content-length']) {
              res.setHeader('Content-Length', proxyRes.headers['content-length']);
            }
          });
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
          });
        },
      },
      '/uploads': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Ensure proper content-type for images
            if (req.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
              res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'image/jpeg');
            }
            // Preserve CORS headers
            if (proxyRes.headers['access-control-allow-origin']) {
              res.setHeader('Access-Control-Allow-Origin', proxyRes.headers['access-control-allow-origin']);
            }
          });
        },
      },
    },
  },
})

