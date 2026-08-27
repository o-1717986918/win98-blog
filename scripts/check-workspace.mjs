import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const frozen = [
  {
    path: 'prototype/index.html',
    sha256: 'EAEC426E652D79529649AFBC2EA4126E5E073F5C958B29C7A92C1A95C40B8AC9',
    markers: ['<!DOCTYPE html>', 'prefers-reduced-motion', 'data-view="home"'],
  },
  {
    path: 'docs/source/blog-architecture.md',
    sha256: '7C598CB0A1E7D722818975DA653EEB1AFF3828054B0E0C9FD32AABFED3FEF99E',
    markers: ['# 个人博客架构方案：结论汇总', 'chrome 三档分级'],
  },
];

const requiredFiles = [
  'README.md',
  'AGENTS.md',
  'package.json',
  'astro.config.mjs',
  'src/config/site.ts',
  'src/content.config.ts',
  'src/integrations/content-routes.mjs',
  'src/layouts/BaseLayout.astro',
  'src/layouts/StandaloneLayout.astro',
  'src/routes/posts-full.astro',
  'src/routes/posts-minimal.astro',
  'src/routes/posts-none.astro',
  'src/routes/columns-full.astro',
  'src/routes/columns-minimal.astro',
  'src/routes/columns-none.astro',
  'src/content/posts/particle-field/index.mdx',
  'src/content/columns/lab/index.mdx',
  'src/pages/search.astro',
  'src/pages/tags/index.astro',
  'src/pages/privacy.astro',
  'scripts/content-new.mjs',
  'scripts/check-content.mjs',
  'scripts/check-links.mjs',
  'scripts/check-budgets.mjs',
  'scripts/deploy-check.mjs',
  '.github/workflows/ci.yml',
  '.env.example',
  'docs/handover/CURRENT_STATE.md',
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
  'docs/operations/CONTENT_WORKFLOW.md',
  'docs/operations/DEPLOYMENT.md',
  'docs/operations/OPERATIONS.md',
  'docs/decisions/0001-takeover-baseline.md',
  'docs/decisions/0002-production-direction.md',
  'docs/decisions/0003-visual-direction.md',
  'docs/decisions/0004-mainline-visual-refactor.md',
  'docs/decisions/0005-columns-as-first-class-content.md',
  'docs/decisions/0006-site-identity-and-background.md',
  'docs/decisions/0007-production-completeness.md',
  'experiments/single-file-visual-candidate/index.html',
  'experiments/celestial-matrix/index.html',
];

const requiredMarkers = [
  { path: 'AGENTS.md', markers: ['某人的小站', '栏目是一等内容集合', 'none` 构建产物'] },
  { path: 'src/config/site.ts', markers: ["title: '某人的小站'", 'graphite', 'indigo'] },
  { path: 'src/content.config.ts', markers: ["reference('columns')", "z.enum(['full', 'minimal', 'none'])"] },
  { path: 'src/integrations/content-routes.mjs', markers: ['injectRoute', '${collection}-${chrome}.astro'] },
  { path: 'docs/handover/ARCHITECTURE_CONSTRAINTS.md', markers: ['文章为主体', '栏目是一等内容集合', '主题是语义令牌数据'] },
];

const failures = [];

for (const item of frozen) {
  try {
    const contents = await readFile(resolve(root, item.path));
    const actual = createHash('sha256').update(contents).digest('hex').toUpperCase();
    if (actual !== item.sha256) failures.push(`${item.path}: SHA-256 changed (${actual})`);
    const source = contents.toString('utf8');
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
  console.log(`Workspace check passed: ${frozen.length} frozen assets and ${requiredFiles.length} project files verified.`);
}
