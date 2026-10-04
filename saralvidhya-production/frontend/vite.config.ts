import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // In local dev, proxy /api to the local backend so CORS is not an issue.
      // Switch VITE_API_BASE_URL in .env.local to use Cloud Run directly.
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
