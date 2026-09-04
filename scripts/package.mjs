import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const out = `account-singularity-extension-${version}.zip`;

execFileSync('zip', ['-r', '-FS', `${root}${out}`, '.', '-x', '.*'], {
  cwd: `${root}dist`,
  stdio: 'inherit',
});

console.log(`\n[package] ${out}`);
