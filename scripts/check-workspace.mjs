import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const expected = [
  {
    path: 'prototype/index.html',
    sha256: 'EAEC426E652D79529649AFBC2EA4126E5E073F5C958B29C7A92C1A95C40B8AC9',
    requiredText: ['<!DOCTYPE html>', 'prefers-reduced-motion', "data-view=\"home\""],
  },
  {
    path: 'docs/source/blog-architecture.md',
    sha256: '7C598CB0A1E7D722818975DA653EEB1AFF3828054B0E0C9FD32AABFED3FEF99E',
    requiredText: ['# 个人博客架构方案：结论汇总', 'chrome 三档分级'],
  },
];

const requiredDocuments = [
  'AGENTS.md',
  'docs/handover/CURRENT_STATE.md',
  'docs/handover/TAKEOVER_PLAN.md',
  'docs/handover/PLAN_REVIEW.md',
  'docs/handover/DESIGN_REVIEW.md',
  'docs/handover/PRINCIPLES.md',
  'docs/handover/MIGRATION_MANIFEST.md',
  'docs/decisions/0001-takeover-baseline.md',
  'docs/decisions/0002-production-direction.md',
];

const failures = [];

for (const item of expected) {
  try {
    const contents = await readFile(resolve(root, item.path));
    const actual = createHash('sha256').update(contents).digest('hex').toUpperCase();
    if (actual !== item.sha256) {
      failures.push(`${item.path}: SHA-256 changed (${actual})`);
    }
    const text = contents.toString('utf8');
    for (const marker of item.requiredText) {
      if (!text.includes(marker)) failures.push(`${item.path}: missing marker ${marker}`);
    }
  } catch (error) {
    failures.push(`${item.path}: ${error.message}`);
  }
}

for (const path of requiredDocuments) {
  try {
    await readFile(resolve(root, path));
  } catch (error) {
    failures.push(`${path}: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error('Workspace check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Workspace check passed: ${expected.length} source assets and ${requiredDocuments.length} handover documents verified.`);
}
