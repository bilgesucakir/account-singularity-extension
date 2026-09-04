import { build, context } from 'esbuild';

/**
 * Bundles the content script as a single self-contained IIFE. Content scripts
 * run in every page and cannot use static `import`, so unlike the popup and the
 * background worker this entry point is not built by Vite.
 */

const watch = process.argv.includes('--watch');
const dev = watch || process.env.NODE_ENV === 'development';

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: ['src/content/index.ts'],
  outfile: 'dist/content.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome116', 'safari16'],
  sourcemap: dev ? 'inline' : false,
  minify: !dev,
  legalComments: 'none',
  logLevel: 'info',
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('[content] watching src/content …');
} else {
  await build(options);
}
