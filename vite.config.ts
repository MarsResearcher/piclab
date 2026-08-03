import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Project Pages URL: https://<user>.github.io/PixelWorks/
  base: process.env.GITHUB_ACTIONS ? '/PixelWorks/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  worker: {
    format: 'es',
  },
});
