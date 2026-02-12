import { defineConfig } from 'vite';
import { crx, ManifestV3Export } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    crx({ manifest: manifest as ManifestV3Export }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
