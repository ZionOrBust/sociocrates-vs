import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // Root is implicitly the folder containing this file: client/
  build: {
    outDir: "dist",       // stays inside client/
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: false, // Allow fallback ports if 3000 is busy
    cors: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        timeout: 30000, // 30 second timeout
        proxyTimeout: 30000,
        // Add error handling for proxy
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
            res.writeHead(500, {
              'Content-Type': 'text/plain'
            });
            res.end('Proxy error: Backend server not available');
          });
        }
      },
    },
    hmr: {
      port: 3001, // Use different port for HMR
      clientPort: 3001,
    },
  },
  esbuild: {
    target: 'es2020',
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@vite/client', '@vite/env'],
  },
});
