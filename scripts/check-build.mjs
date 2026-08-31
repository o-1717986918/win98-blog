import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const siteUrl = (process.env.SITE_URL || 'http://localhost:4321').replace(/\/+$/, '');
const normalizedBasePath = process.env.BASE_PATH?.replace(/^\/+|\/+$/g, '') ?? '';
const basePath = normalizedBasePath ? `/${normalizedBasePath}` : '';
const publicUrl = `${siteUrl}${basePath}`;
const read = (path) => readFile(resolve(root, path), 'utf8');
const failures = [];
const requireText = (source, text, label) => { if (!source.includes(text)) failures.push(`${label}: missing ${text}`); };
const forbidText = (source, text, label) => { if (source.includes(text)) failures.push(`${label}: unexpectedly contains ${text}`); };

const home = await read('dist/index.html');
const about = await read('dist/about/index.html');
const archive = await read('dist/archive/index.html');
const full = await read('dist/posts/theme-as-data/index.html');
const minimal = await read('dist/posts/reader-control/index.html');
const nonePost = await read('dist/posts/particle-field/index.html');
const noneColumn = await read('dist/columns/lab/index.html');
const fullColumn = await read('dist/columns/engineering/index.html');
const minimalColumn = await read('dist/columns/academic/index.html');
const componentPost = await read('dist/posts/modular-blog/index.html');
const arcRelease = await read('dist/posts/arcvellum-release/index.html');
const arcColumn = await read('dist/columns/arcvellum/index.html');
const solverPost = await read('dist/posts/sokoban-two-phase-solver/index.html');
const notesIndex = await read('dist/notes/index.html');
const publicNote = await read('dist/notes/welcome/index.html');
const rss = await read('dist/rss.xml');
const sitemap = await read('dist/sitemap-0.xml');
const search = await read('dist/search/index.html');
const tags = await read('dist/tags/index.html');
const privacy = await read('dist/privacy/index.html');
const projects = await read('dist/projects/index.html');
const skills = await read('dist/skills/index.html');
const timeline = await read('dist/timeline/index.html');
const robots = await read('dist/robots.txt');
const llms = await read('dist/llms.txt');
const searchScript = await read('dist/scripts/search.js');

requireText(home, '<title>win98的小站</title>', 'home');
requireText(home, 'data-site-intro', 'home session intro');
requireText(about, 'ProfilePage', 'about structured data');
requireText(about, 'h-card', 'about IndieWeb identity');
requireText(archive, 'data-archive-ledger', 'archive chronological ledger');
requireText(archive, 'data-archive-year', 'archive year grouping');
requireText(archive, 'data-archive-month', 'archive month grouping');
requireText(archive, 'PUBLICATION YEAR', 'archive visual chronology');
requireText(home, '/columns/engineering/', 'home');
requireText(home, 'data-content-cover', 'home content covers');
requireText(home, 'data-home-post-stream', 'home chronological stream');
requireText(home, 'data-publication-calendar', 'home publication calendar');
requireText(home, 'data-portal-controls', 'home persisted portal preferences');
requireText(home, 'data-stream-more', 'home progressive writing stream');
requireText(home, 'home-featured-return', 'home bottom featured return');
forbidText(home, 'portal-gateway', 'home redundant portal directory');
forbidText(home, '站内入口', 'home redundant portal directory');
requireText(projects, '项目<br>陈列', 'projects feature page');
requireText(projects, 'ArcVellum', 'projects real data');
requireText(skills, '能力<br>图谱', 'skills feature page');
requireText(skills, '查看支撑证据', 'skills evidence links');
requireText(timeline, 'data-feature-timeline', 'filterable timeline feature page');
requireText(timeline, 'data-timeline-filter="PROJECT"', 'timeline project filter');
requireText(full, '<header class="site-header"', 'full post');
requireText(full, '<footer class="site-footer"', 'full post');
requireText(full, 'class="reader-controls"', 'full post');
requireText(full, 'BlogPosting', 'full post SEO');
requireText(full, 'h-entry', 'full post IndieWeb entry');
requireText(full, 'data-performance-vitals', 'full post field performance sample');
requireText(full, 'data-reading-progress', 'full post reading progress');
requireText(full, 'class="motion-toggle"', 'full post motion control');
requireText(full, 'data-pagefind-body', 'full post search boundary');
requireText(full, 'data-content-cover', 'full post cover');
forbidText(full, 'class="back-badge"', 'full post redundant back bridge');
requireText(full, `property="og:image" content="${publicUrl}/_astro/cover.`, 'full post real-cover social image');
requireText(componentPost, 'data-code-playground', 'MDX component library');
requireText(componentPost, 'data-chart', 'accessible MDX chart');
requireText(componentPost, 'data-evidence-ledger', 'article evidence ledger');
for (const [label, source] of [
  ['ArcVellum release', arcRelease],
  ['ArcVellum column', arcColumn],
  ['solver story', solverPost],
]) {
  requireText(source, 'data-pagefind-body', `${label} search boundary`);
  forbidText(source, '<header class="site-header"', `${label} isolated chrome`);
  forbidText(source, '<footer class="site-footer"', `${label} isolated chrome`);
}
forbidText(arcColumn, 'class="back-badge"', 'ArcVellum owns its return navigation');
requireText(solverPost, 'data-solver-viz', 'solver functional module');
requireText(solverPost, 'LIVE CORE / C99', 'solver Wasm interface');
await access(resolve(root, 'dist/solver/solver-engine.wasm')).catch(() => failures.push('solver Wasm artifact: missing'));
await access(resolve(root, 'dist/solver/solver-worker.js')).catch(() => failures.push('solver worker artifact: missing'));
requireText(notesIndex, 'PUBLIC VAULT', 'learning notes module');
requireText(notesIndex, 'data-note-workbench', 'learning notes functional workbench');
requireText(notesIndex, 'data-note-search', 'learning notes search');
requireText(notesIndex, 'data-note-panel', 'learning notes rendered preview');
requireText(notesIndex, 'data-preview-maturity', 'learning notes maturity model');
requireText(notesIndex, 'data-preview-backlinks', 'learning notes parsed graph');
forbidText(notesIndex, 'garden-hero', 'learning notes promotional hero');
forbidText(notesIndex, '<header class="site-header"', 'learning notes isolated chrome');
forbidText(notesIndex, '<footer class="site-footer"', 'learning notes isolated chrome');
forbidText(notesIndex, 'class="back-badge"', 'learning notes owns its return navigation');
requireText(notesIndex, 'CollectionPage', 'learning notes structured data');
requireText(publicNote, 'data-pagefind-body', 'public note search boundary');
requireText(publicNote, '反向链接', 'public note backlink area');
requireText(publicNote, '延伸阅读', 'public note outgoing relations');
forbidText(minimal, '<header class="site-header"', 'minimal post');
forbidText(minimal, '<footer class="site-footer"', 'minimal post');
requireText(minimal, 'class="reader-controls"', 'minimal post');
requireText(minimal, 'class="back-badge"', 'minimal post');
requireText(minimal, 'data-pagefind-body', 'minimal post search boundary');
requireText(minimal, 'data-content-cover', 'minimal post cover');
requireText(fullColumn, 'data-content-cover', 'full column cover');
requireText(fullColumn, 'CollectionPage', 'column structured data');
requireText(minimalColumn, 'data-content-cover', 'minimal column cover');

for (const [label, source] of [['none post', nonePost], ['none column', noneColumn]]) {
  forbidText(source, '<header class="site-header"', label);
  forbidText(source, '<footer class="site-footer"', label);
  forbidText(source, 'class="reader-controls"', label);
  forbidText(source, 'FullShell.', label);
  forbidText(source, 'minimal-main', label);
  forbidText(source, 'giscus.app', label);
  forbidText(source, 'cloudflareinsights.com', label);
  forbidText(source, 'data-motion-toggle', label);
  forbidText(source, 'data-performance-vitals', `${label} field performance adapter`);
  forbidText(source, 'data-content-cover', `${label} automatic cover injection`);
  requireText(source, 'class="back-badge"', label);
}

requireText(rss, '/posts/particle-field/', 'RSS');
requireText(rss, '/posts/theme-as-data/', 'RSS');
requireText(sitemap, '/columns/lab/', 'sitemap');
requireText(sitemap, '/search/', 'sitemap');
requireText(sitemap, '/notes/welcome/', 'sitemap notes');
requireText(search, 'data-search-index', 'search');
forbidText(searchScript, "filters: { type: '文章' }", 'search scope');
requireText(searchScript, 'safeExcerpt', 'search excerpt sanitizer');
requireText(nonePost, 'data-pagefind-body', 'none post search boundary');
requireText(tags, '/tags/', 'tags');
requireText(privacy, '当前状态：未启用', 'privacy defaults');
requireText(robots, '/sitemap-index.xml', 'robots');
requireText(llms, '# win98的小站', 'llms');
for (const [label, source] of [['home', home], ['full post', full], ['minimal post', minimal]]) {
  forbidText(source, 'giscus.app/client.js', `${label} default comments`);
  forbidText(source, 'cloudflareinsights.com/beacon.min.js', `${label} default analytics`);
}
for (const [label, source] of [['home', home], ['RSS', rss], ['sitemap', sitemap]]) {
  forbidText(source, '文书手记', label);
  forbidText(source, '文枢手记', label);
}

for (const path of ['dist/pagefind/pagefind.js', 'dist/brand/logo.jpg', 'dist/site.webmanifest', 'dist/og-default.svg', 'dist/_headers']) {
  try { await access(resolve(root, path)); }
  catch { failures.push(`${path}: missing build artifact`); }
}

try {
  const og = await readFile(resolve(root, 'dist/og/posts/theme-as-data.png'));
  if (og.length < 10_000 || !og.subarray(1, 4).equals(Buffer.from('PNG'))) failures.push('generated OG image is not a valid non-trivial PNG');
} catch { failures.push('dist/og/posts/theme-as-data.png: missing build artifact'); }

if (failures.length) {
  console.error('Build contract check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Build contract check passed: routes, identity, discovery, SEO, privacy and chrome isolation verified.');
}
