import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Three.js alone is ~500 kB; that's fine for this prototype.
    chunkSizeWarningLimit: 900,
  },
});
