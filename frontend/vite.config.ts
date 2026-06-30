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
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('node_modules/react/')) return 'vendor';
          if (id.includes('@tanstack/react-query')) return 'query';
          if (id.includes('lucide-react') || id.includes('framer-motion')) return 'ui';
          if (id.includes('recharts')) return 'charts';
        },
      },
    },
  },
});
