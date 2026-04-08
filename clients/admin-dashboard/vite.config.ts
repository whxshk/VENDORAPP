import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: 'https://sharkband-api.azurewebsites.net',
        changeOrigin: true,
      },
    },
  },
  preview: { port: 5175 },
});
