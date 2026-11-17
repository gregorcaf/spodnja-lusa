import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths, so the build works from any subfolder
  // (e.g. GitHub Pages serves it at /spodnja-lusa/).
  base: './',
  build: {
    // Three.js alone is ~500 kB; that's fine for this prototype.
    chunkSizeWarningLimit: 900,
  },
});
