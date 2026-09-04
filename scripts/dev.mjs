import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

/**
 * Runs the two builders in watch mode side by side and writes an unpacked
 * extension to `dist/`. Load that folder via chrome://extensions (Developer
 * mode → Load unpacked); reload the extension there after a rebuild.
 */

const clean = spawn(process.execPath, ['scripts/clean.mjs'], { stdio: 'inherit' });
clean.on('exit', () => {
  const bin = (name) =>
    resolve('node_modules', '.bin', process.platform === 'win32' ? `${name}.cmd` : name);

  const children = [
    spawn(bin('vite'), ['build', '--watch', '--mode', 'development'], { stdio: 'inherit' }),
    spawn(process.execPath, ['scripts/build-content.mjs', '--watch'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' },
    }),
  ];

  const shutdown = () => children.forEach((child) => child.kill('SIGTERM'));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  for (const child of children) {
    child.on('exit', (code) => {
      if (code) {
        shutdown();
        process.exitCode = code;
      }
    });
  }
});
