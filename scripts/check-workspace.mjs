import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const referenceAssets = [
  {
    path: 'prototype/index.html',
    markers: ['<!DOCTYPE html>', 'prefers-reduced-motion', 'data-view="home"'],
  },
  {
    path: 'docs/source/blog-architecture.md',
    markers: ['# 个人博客架构方案：结论汇总', 'chrome 三档分级'],
  },
];

const requiredFiles = [
  'README.md',
  'AGENTS.md',
  'package.json',
  'tsconfig.scripts.json',
  'astro.config.mjs',
  'src/config/site.ts',
  'src/content.config.ts',
  'src/lib/frontmatter.mjs',
  'src/lib/browser-storage.ts',
  'src/lib/date.ts',
  'src/lib/publication-clock.mjs',
  'src/integrations/content-routes.mjs',
  'src/layouts/BaseLayout.astro',
  'src/layouts/StandaloneLayout.astro',
  'src/components/ContentCover.astro',
  'src/components/arcvellum/docs.ts',
  'src/lib/arcvellum-orrery-demo.ts',
  'src/components/sokoban/SolverVisualizer.astro',
  'public/solver/solver-engine.wasm',
  'public/solver/solver-worker.js',
  'tools/solver-wasm/bridge.c',
  'tools/solver-wasm/build.ps1',
  'tools/solver-wasm/smoke.mjs',
  'tools/solver-wasm/solver-engine.provenance.json',
  'tools/blog-studio/server.mjs',
  'tools/blog-studio/path-policy.mjs',
  'tools/blog-studio/path-policy.test.mjs',
  'tools/blog-studio/sync-notes.mjs',
  'tools/blog-studio/index.html',
  'tools/blog-studio/studio.css',
  'tools/blog-studio/studio.js',
  'src/components/content/Callout.astro',
  'src/components/content/DataChart.astro',
  'src/components/content/CodePlayground.astro',
  'src/components/content/EvidenceLedger.astro',
  'src/components/PerformanceVitals.astro',
  'src/lib/note-graph.ts',
  'src/lib/home-interactions.ts',
  'src/lib/notes-workbench.ts',
  'src/assets/fonts/site-signature.woff2',
  'src/assets/fonts/OFL.txt',
  'src/assets/fonts/README.md',
  'src/lib/social-image.ts',
  'src/pages/og/[collection]/[...slug].png.ts',
  'src/routes/posts-full.astro',
  'src/routes/posts-minimal.astro',
  'src/routes/posts-none.astro',
  'src/routes/columns-full.astro',
  'src/routes/columns-minimal.astro',
  'src/routes/columns-none.astro',
  'src/content/posts/particle-field/index.mdx',
  'src/content/columns/lab/index.mdx',
  'src/pages/search.astro',
  'src/pages/notes/index.astro',
  'src/pages/notes/[...slug].astro',
  'src/pages/tags/index.astro',
  'src/pages/privacy.astro',
  'scripts/content-new.mjs',
  'scripts/check-content.mjs',
  'scripts/check-covers.mjs',
  'scripts/check-links.mjs',
  'scripts/check-budgets.mjs',
  'scripts/deploy-check.mjs',
  'scripts/check-cloudflare-config.mjs',
  'scripts/deploy-cloudflare-pages.mjs',
  'scripts/check-container.mjs',
  'Dockerfile',
  '.dockerignore',
  'compose.yaml',
  'docker/nginx.conf',
  'docker/security-headers.conf',
  '.github/workflows/ci.yml',
  '.github/workflows/deploy.yml',
  '.github/workflows/github-pages.yml',
  '.github/workflows/publish-ghcr.yml',
  'playwright.config.ts',
  'tests/e2e/site.spec.ts',
  'src/tests/content-routes.test.ts',
  'src/tests/date.test.ts',
  'src/tests/notes-sync.test.ts',
  '.env.example',
  'docs/KNOWN_ISSUES.md',
  'docs/handover/CURRENT_STATE.md',
  'docs/handover/BLOG_SYSTEM_REDESIGN_AND_STUDIO_PLAN.md',
  'docs/handover/ARCVELLUM_EDITORIAL_BACKLOG.md',
  'docs/handover/FINAL_BLOG_CRITICAL_REVIEW.md',
  'docs/handover/TAKEOVER_PLAN.md',
  'docs/handover/PLAN_REVIEW.md',
  'docs/handover/DESIGN_REVIEW.md',
  'docs/handover/ARCHITECTURE_CONSTRAINTS.md',
  'docs/handover/BLOG_CONSTRUCTION_RESEARCH.md',
  'docs/handover/COLUMN_MODEL.md',
  'docs/handover/MAINLINE_REDESIGN_SPEC.md',
  'docs/handover/MAINLINE_REDESIGN_REVIEW.md',
  'docs/handover/PRINCIPLES.md',
  'docs/handover/MIGRATION_MANIFEST.md',
  'docs/handover/DELIVERY_PLAN.md',
  'docs/handover/UI_REDESIGN_V4.md',
  'docs/handover/CONTENT_COVER_SYSTEM.md',
  'docs/handover/ARCHITECTURE_IMPLEMENTATION_GAPS.md',
  'docs/operations/CONTENT_WORKFLOW.md',
  'docs/operations/DEPLOYMENT.md',
  'docs/operations/PRODUCTION_CHECKLIST.md',
  'docs/operations/OPERATIONS.md',
  'docs/operations/BLOG_STUDIO.md',
  'docs/decisions/0001-takeover-baseline.md',
  'docs/decisions/0002-production-direction.md',
  'docs/decisions/0003-visual-direction.md',
  'docs/decisions/0004-mainline-visual-refactor.md',
  'docs/decisions/0005-columns-as-first-class-content.md',
  'docs/decisions/0006-site-identity-and-background.md',
  'docs/decisions/0007-production-completeness.md',
  'docs/decisions/0008-inline-discovery-and-chromatic-depth.md',
  'docs/decisions/0009-spectral-margins-and-stable-accents.md',
  'docs/decisions/0010-deterministic-content-covers.md',
  'docs/decisions/0011-production-closure-and-two-theme-system.md',
  'docs/decisions/0012-reader-facing-copy-and-pages-deployment.md',
  'docs/decisions/0013-evidence-garden-and-open-web.md',
  'docs/decisions/0014-mizuki-portal-structure-visual-continuity.md',
  'docs/decisions/0015-portal-features-real-data-and-progressive-enhancement.md',
  'docs/decisions/0016-desktop-navigation-rail-and-bottom-featured-return.md',
  'docs/decisions/0017-home-entry-deduplication-and-layered-sidebar.md',
  'docs/decisions/0018-release-integrity-and-single-source-contracts.md',
  'docs/decisions/0019-ghcr-baota-container-delivery.md',
  'experiments/single-file-visual-candidate/index.html',
  'experiments/celestial-matrix/index.html',
];

const requiredMarkers = [
  { path: 'AGENTS.md', markers: ['win98的小站', '栏目是一等内容集合', 'none` 构建产物'] },
  { path: 'src/config/site.ts', markers: ["title: 'win98的小站'", "['mist', 'abyss']", 'resolveTheme'] },
  { path: 'src/content.config.ts', markers: ["reference('columns')", 'chromeSchema as chrome'] },
  { path: 'src/lib/frontmatter.mjs', markers: ["CHROME_LEVELS = ['full', 'minimal', 'none']", 'z.enum(CHROME_LEVELS)', 'routeSchemas'] },
  { path: 'src/integrations/content-routes.mjs', markers: ['injectRoute', '${collection}-${chrome}.astro'] },
  { path: 'docs/handover/ARCHITECTURE_CONSTRAINTS.md', markers: ['文章为主体', '栏目是一等内容集合', '主题是语义令牌数据'] },
];

const failures = [];

for (const item of referenceAssets) {
  try {
    const source = await readFile(resolve(root, item.path), 'utf8');
    for (const marker of item.markers) if (!source.includes(marker)) failures.push(`${item.path}: missing ${marker}`);
  } catch (error) {
    failures.push(`${item.path}: ${error.message}`);
  }
}

for (const path of requiredFiles) {
  try { await readFile(resolve(root, path)); }
  catch (error) { failures.push(`${path}: ${error.message}`); }
}

for (const item of requiredMarkers) {
  try {
    const source = await readFile(resolve(root, item.path), 'utf8');
    for (const marker of item.markers) if (!source.includes(marker)) failures.push(`${item.path}: missing ${marker}`);
  } catch (error) {
    failures.push(`${item.path}: ${error.message}`);
  }
}

if (failures.length) {
  console.error('Workspace check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Workspace check passed: ${referenceAssets.length} reference assets and ${requiredFiles.length} project files verified.`);
}
