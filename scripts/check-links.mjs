import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'dist');
const basePath = process.env.BASE_PATH ? `/${process.env.BASE_PATH.replace(/^\/+|\/+$/g, '')}` : '';
const withoutBase = (pathname) => {
  if (!basePath) return pathname;
  if (pathname === basePath || pathname === `${basePath}/`) return '/';
  return pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) : pathname;
};
const htmlFiles = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.name.endsWith('.html')) htmlFiles.push(path);
  }
}
await walk(dist);

const failures = [];
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const staticHtml = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  for (const match of staticHtml.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const raw = match[1];
    if (!raw || raw.startsWith('#') || raw.startsWith('data:') || raw.startsWith('mailto:') || raw.startsWith('tel:')) continue;
    let url;
    try { url = new URL(raw, 'https://local.invalid'); } catch { failures.push(`${file}: malformed URL ${raw}`); continue; }
    if (url.origin !== 'https://local.invalid') continue;
    let pathname;
    try { pathname = withoutBase(decodeURIComponent(url.pathname)); } catch { failures.push(`${file}: invalid URL encoding ${raw}`); continue; }
    const target = pathname.endsWith('/') ? join(dist, pathname, 'index.html') : join(dist, pathname);
    const fallback = extname(target) ? target : `${target}.html`;
    try { await stat(target); }
    catch {
      try { await stat(fallback); }
      catch { failures.push(`${file}: broken internal reference ${raw}`); }
    }
  }
}

if (failures.length) {
  console.error('Internal link check failed:');
  failures.slice(0, 30).forEach((failure) => console.error(`- ${failure}`));
  if (failures.length > 30) console.error(`- ...and ${failures.length - 30} more`);
  process.exitCode = 1;
} else {
  console.log(`Internal link check passed: ${htmlFiles.length} HTML files verified.`);
}
