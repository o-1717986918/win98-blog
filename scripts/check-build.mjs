import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (path) => readFile(resolve(root, path), 'utf8');
const failures = [];
const requireText = (source, text, label) => { if (!source.includes(text)) failures.push(`${label}: missing ${text}`); };
const forbidText = (source, text, label) => { if (source.includes(text)) failures.push(`${label}: unexpectedly contains ${text}`); };

const home = await read('dist/index.html');
const full = await read('dist/posts/modular-blog/index.html');
const minimal = await read('dist/posts/reader-control/index.html');
const nonePost = await read('dist/posts/particle-field/index.html');
const noneColumn = await read('dist/columns/lab/index.html');
const rss = await read('dist/rss.xml');
const sitemap = await read('dist/sitemap-0.xml');

requireText(home, '<title>某人的小站</title>', 'home');
requireText(home, '/columns/engineering/', 'home');
requireText(full, '<header class="site-header"', 'full post');
requireText(full, '<footer class="site-footer"', 'full post');
requireText(full, 'class="reader-controls"', 'full post');
forbidText(minimal, '<header class="site-header"', 'minimal post');
forbidText(minimal, '<footer class="site-footer"', 'minimal post');
requireText(minimal, 'class="reader-controls"', 'minimal post');
requireText(minimal, 'class="back-badge"', 'minimal post');

for (const [label, source] of [['none post', nonePost], ['none column', noneColumn]]) {
  forbidText(source, '<header class="site-header"', label);
  forbidText(source, '<footer class="site-footer"', label);
  forbidText(source, 'class="reader-controls"', label);
  forbidText(source, 'FullShell.', label);
  forbidText(source, 'minimal-main', label);
  requireText(source, 'class="back-badge"', label);
}

requireText(rss, '/posts/particle-field/', 'RSS');
requireText(sitemap, '/columns/lab/', 'sitemap');
requireText(sitemap, '/posts/modular-blog/', 'sitemap');
for (const [label, source] of [['home', home], ['RSS', rss], ['sitemap', sitemap]]) {
  forbidText(source, '文书手记', label);
  forbidText(source, '文枢手记', label);
}

if (failures.length) {
  console.error('Build contract check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Build contract check passed: routes, identity, feeds and chrome isolation verified.');
}
