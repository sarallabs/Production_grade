import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // In local dev, proxy /api to the local backend so CORS is not an issue.
      // Switch VITE_API_BASE_URL in .env.local to use Cloud Run directly.
      '/api': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
    },
  },
});
