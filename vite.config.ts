import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Production builds are served from GitHub Pages at /taboo-game/.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/taboo-game/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
}));
