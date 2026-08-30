import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'dist');
const basePath = process.env.BASE_PATH ? `/${process.env.BASE_PATH.replace(/^\/+|\/+$/g, '')}` : '';
const withoutBase = (pathname) => basePath && pathname.startsWith(`${basePath}/`)
  ? pathname.slice(basePath.length)
  : pathname;
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
const html = files.filter((file) => file.path.endsWith('.html'));
const media = files.filter((file) => /\.(?:avif|webp|png|jpe?g)$/i.test(file.path));
const total = (items) => items.reduce((sum, file) => sum + file.size, 0);
const transferredJs = await Promise.all(authoredJs.map(async (file) => ({
  ...file,
  gzipSize: gzipSync(await readFile(file.path)).length,
})));
const totalGzip = (items) => items.reduce((sum, file) => sum + file.gzipSize, 0);
const cssByPublicPath = new Map(css.map((file) => [
  `/${file.path.slice(dist.length + 1).replaceAll('\\', '/')}`,
  file.size,
]));
const routeCss = await Promise.all(html.map(async (file) => {
  const source = await readFile(file.path, 'utf8');
  const references = [...new Set([...source.matchAll(/href="([^"]+\.css)"/gu)].map((match) => match[1]))];
  return {
    path: file.path,
    size: references.reduce((sum, reference) => sum + (cssByPublicPath.get(withoutBase(reference)) ?? 0), 0),
  };
}));
const heaviestRoute = routeCss.sort((a, b) => b.size - a.size)[0] ?? { path: '', size: 0 };
const failures = [];
if (transferredJs.some((file) => file.gzipSize > 75 * 1024)) failures.push('a JavaScript asset exceeds 75 KiB gzip');
if (totalGzip(transferredJs) > 180 * 1024) failures.push(`site JavaScript is ${Math.ceil(totalGzip(transferredJs) / 1024)} KiB gzip (budget 180 KiB)`);
if (heaviestRoute.size > 80 * 1024) failures.push(`a page loads ${Math.ceil(heaviestRoute.size / 1024)} KiB CSS (budget 80 KiB): ${heaviestRoute.path}`);
if (total(css) > 200 * 1024) failures.push(`site-wide route-isolated CSS is ${Math.ceil(total(css) / 1024)} KiB (maintenance budget 200 KiB)`);
if (media.some((file) => file.size > 700 * 1024)) failures.push('an optimized media asset exceeds 700 KiB');

if (failures.length) {
  console.error('Performance budget check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Performance budgets passed: ${Math.ceil(totalGzip(transferredJs) / 1024)} KiB gzip JS, max ${Math.ceil(heaviestRoute.size / 1024)} KiB CSS/page, ${Math.ceil(total(css) / 1024)} KiB route-isolated CSS.`);
}
