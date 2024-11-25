import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept, Authorization'
    },
  },
  build: {
    target: 'esnext', // Bu satırı ekleyin
    rollupOptions: {
      input: {
        main: './index.html',
        tracker: './public/tracker.js'
      },
      output: {
        entryFileNames: (assetInfo) => {
          return assetInfo.name === 'tracker' ? 'tracker.js' : 'assets/[name]-[hash].js';
        }
      }
    }
  }
});