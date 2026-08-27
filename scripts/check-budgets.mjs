import { readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'dist');
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else files.push({ path, size: (await stat(path)).size });
  }
}
await walk(dist);

const authoredJs = files.filter((file) => file.path.endsWith('.js') && (
  file.path.includes(`${join('dist', '_astro')}`) || file.path.includes(`${join('dist', 'scripts')}`)
));
const css = files.filter((file) => file.path.endsWith('.css') && !file.path.includes(`${join('dist', 'pagefind')}`));
const media = files.filter((file) => /\.(?:avif|webp|png|jpe?g)$/i.test(file.path));
const total = (items) => items.reduce((sum, file) => sum + file.size, 0);
const failures = [];
if (authoredJs.some((file) => file.size > 90 * 1024)) failures.push('an authored JavaScript asset exceeds 90 KiB');
if (total(css) > 160 * 1024) failures.push(`site CSS is ${Math.ceil(total(css) / 1024)} KiB (budget 160 KiB)`);
if (media.some((file) => file.size > 700 * 1024)) failures.push('an optimized media asset exceeds 700 KiB');

if (failures.length) {
  console.error('Performance budget check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Performance budgets passed: ${Math.ceil(total(authoredJs) / 1024)} KiB authored JS, ${Math.ceil(total(css) / 1024)} KiB CSS.`);
}
