import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'dist');
const normalizedBasePath = process.env.BASE_PATH?.replace(/^\/+|\/+$/g, '') ?? '';
const basePath = normalizedBasePath ? `/${normalizedBasePath}` : '';
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
const jsByPublicPath = new Map(transferredJs.map((file) => [
  `/${file.path.slice(dist.length + 1).replaceAll('\\', '/')}`,
  file.gzipSize,
]));
const jsFileByPublicPath = new Map(transferredJs.map((file) => [
  `/${file.path.slice(dist.length + 1).replaceAll('\\', '/')}`,
  file.path,
]));
const dependencyCache = new Map();
const normalizeScriptReference = (reference, importer = '/') => {
  const pathname = reference.startsWith('_astro/')
    ? `/${reference}`
    : new URL(reference, `https://local.invalid${importer}`).pathname;
  return withoutBase(pathname);
};
async function scriptDependencies(publicPath) {
  if (dependencyCache.has(publicPath)) return dependencyCache.get(publicPath);
  const file = jsFileByPublicPath.get(publicPath);
  if (!file) return [];
  const source = await readFile(file, 'utf8');
  const references = [...source.matchAll(/["'`]((?:\.\/|\/|_astro\/)[^"'`]+\.js)["'`]/gu)]
    .map((match) => normalizeScriptReference(match[1], publicPath));
  const dependencies = [...new Set(references.filter((reference) => jsByPublicPath.has(reference)))];
  dependencyCache.set(publicPath, dependencies);
  return dependencies;
}
async function reachableScripts(initial) {
  const pending = [...initial];
  const visited = new Set();
  while (pending.length) {
    const current = pending.pop();
    if (visited.has(current) || !jsByPublicPath.has(current)) continue;
    visited.add(current);
    pending.push(...await scriptDependencies(current));
  }
  return visited;
}
const routeCss = await Promise.all(html.map(async (file) => {
  const source = await readFile(file.path, 'utf8');
  const references = [...new Set([...source.matchAll(/href="([^"]+\.css)"/gu)].map((match) => match[1]))];
  return {
    path: file.path,
    size: references.reduce((sum, reference) => sum + (cssByPublicPath.get(withoutBase(reference)) ?? 0), 0),
  };
}));
const routeJs = await Promise.all(html.map(async (file) => {
  const source = await readFile(file.path, 'utf8');
  const references = [...new Set([...source.matchAll(/(?:src|href)="([^"]+\.js)"/gu)]
    .map((match) => normalizeScriptReference(match[1])))];
  const reachable = await reachableScripts(references);
  return {
    path: file.path,
    gzipSize: [...reachable].reduce((sum, reference) => sum + (jsByPublicPath.get(reference) ?? 0), 0),
  };
}));
const heaviestRoute = routeCss.sort((a, b) => b.size - a.size)[0] ?? { path: '', size: 0 };
const heaviestJsRoute = routeJs.sort((a, b) => b.gzipSize - a.gzipSize)[0] ?? { path: '', gzipSize: 0 };
const failures = [];
if (transferredJs.some((file) => file.gzipSize > 75 * 1024)) failures.push('a JavaScript asset exceeds 75 KiB gzip');
if (totalGzip(transferredJs) > 180 * 1024) failures.push(`site JavaScript is ${Math.ceil(totalGzip(transferredJs) / 1024)} KiB gzip (budget 180 KiB)`);
if (heaviestJsRoute.gzipSize > 175 * 1024) failures.push(`a page can load ${Math.ceil(heaviestJsRoute.gzipSize / 1024)} KiB gzip JavaScript including lazy chunks (budget 175 KiB): ${heaviestJsRoute.path}`);
if (heaviestRoute.size > 80 * 1024) failures.push(`a page loads ${Math.ceil(heaviestRoute.size / 1024)} KiB CSS (budget 80 KiB): ${heaviestRoute.path}`);
if (total(css) > 240 * 1024) failures.push(`site-wide route-isolated CSS is ${Math.ceil(total(css) / 1024)} KiB (repository maintenance budget 240 KiB)`);
if (media.some((file) => file.size > 700 * 1024)) failures.push('an optimized media asset exceeds 700 KiB');

if (failures.length) {
  console.error('Performance budget check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Performance budgets passed: ${Math.ceil(totalGzip(transferredJs) / 1024)} KiB gzip JS total, max ${Math.ceil(heaviestJsRoute.gzipSize / 1024)} KiB reachable JS/page, max ${Math.ceil(heaviestRoute.size / 1024)} KiB CSS/page, ${Math.ceil(total(css) / 1024)} KiB route-isolated CSS.`);
}
