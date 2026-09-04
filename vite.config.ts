import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const src = resolve(import.meta.dirname, 'src');
const outDir = resolve(import.meta.dirname, 'dist');

/**
 * Vite builds the two entry points that are allowed to be ES modules:
 *   - the popup page (`popup/index.html` + its script)
 *   - the background service worker (`"type": "module"` in the manifest)
 *
 * The content script is NOT built here: content scripts cannot use static
 * `import`, so it is bundled separately as a single IIFE file by
 * `scripts/build-content.mjs`. `dist/` is cleaned by `scripts/clean.mjs` before
 * a build, so `emptyOutDir` is left off to avoid racing the content-script
 * bundle during `npm run dev`.
 */
export default defineConfig(({ mode }) => ({
  root: src,
  publicDir: resolve(src, 'public'),
  build: {
    outDir,
    emptyOutDir: false,
    sourcemap: mode === 'production' ? false : 'inline',
    minify: mode === 'production',
    target: 'es2022',
    rollupOptions: {
      input: {
        background: resolve(src, 'background/index.ts'),
        popup: resolve(src, 'popup/index.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
}));
