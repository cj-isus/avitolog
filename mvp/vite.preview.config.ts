import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  base: './',
  build: { outDir: 'preview-dist', emptyOutDir: true },
  server: { port: 4178, strictPort: true },
});
