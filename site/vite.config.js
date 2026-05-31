import { defineConfig } from 'vite';

// Configurazione minima. Base relativa per deploy statico (Vercel/qualsiasi host).
// Nessun plugin pesante: il sito è vanilla JS + Three.js.
export default defineConfig({
  base: './',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: false,
  },
});
