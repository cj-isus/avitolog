import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { emittedRuntimeReport } from './scripts/bundle-report.mjs';

export default defineConfig({
  plugins: [react(), emittedRuntimeReport('preview')],
  root: '.',
  base: './',
  build: { outDir: 'preview-dist', emptyOutDir: true },
  server: { port: 4178, strictPort: true },
});
