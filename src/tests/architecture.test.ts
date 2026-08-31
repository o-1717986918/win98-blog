import { access, readFile, readdir } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PORTAL_NAVIGATION } from '../config/portal';
import { SITE, THEMES } from '../config/site';
import { parseFrontmatter } from '../lib/frontmatter.mjs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path: string) => readFile(join(root, path), 'utf8');
const importPattern = /(?:from\s*|import\s*)['"](\.[^'"]+)['"]/gu;

async function resolveImport(importer: string, specifier: string) {
  const base = resolve(importer, '..', specifier);
  const candidates = extname(base)
    ? [base]
    : [base, ...['.astro', '.ts', '.mjs', '.js', '.css'].map((suffix) => `${base}${suffix}`)];
  for (const candidate of candidates) {
    try { await access(candidate); return normalize(candidate); }
    catch { /* try the next supported source extension */ }
  }
  return undefined;
}

async function dependencyGraph(entry: string) {
  const pending = [resolve(root, entry)];
  const visited = new Set<string>();
  while (pending.length) {
    const file = normalize(pending.pop()!);
    if (visited.has(file)) continue;
    visited.add(file);
    if (file.endsWith('.css')) continue;
    const source = await readFile(file, 'utf8');
    for (const match of source.matchAll(importPattern)) {
      const dependency = await resolveImport(file, match[1]!);
      if (dependency && dependency.startsWith(root)) pending.push(dependency);
    }
  }
  return [...visited].map((file) => file.slice(root.length + 1).replaceAll('\\', '/'));
}

async function contentFiles(collection: 'posts' | 'columns') {
  const collectionRoot = join(root, 'src', 'content', collection);
  const files: string[] = [];
  async function walk(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/^index\.(md|mdx)$/u.test(entry.name)) files.push(path);
    }
  }
  await walk(collectionRoot);
  return files;
}

describe('blog architecture boundaries', () => {
  it('keeps the document base independent from every visual shell', async () => {
    const graph = await dependencyGraph('src/layouts/BaseLayout.astro');
    expect(graph).not.toEqual(expect.arrayContaining([
      'src/styles/shell.css',
      'src/styles/minimal.css',
      'src/components/chrome/SiteHeader.astro',
      'src/components/chrome/SiteFooter.astro',
      'src/components/chrome/ReaderControls.astro',
      'src/components/AmbientField.astro',
    ]));
    await expect(read('src/layouts/BaseLayout.astro')).resolves.toContain('<slot />');
  });

  it('keeps both none route dependency graphs free of full and minimal services', async () => {
    const forbidden = [
      'src/layouts/FullShell.astro',
      'src/layouts/PostLayout.astro',
      'src/layouts/ColumnLayout.astro',
      'src/layouts/MinimalPostLayout.astro',
      'src/layouts/MinimalColumnLayout.astro',
      'src/components/Analytics.astro',
      'src/components/Comments.astro',
      'src/components/AmbientField.astro',
      'src/components/chrome/ReaderControls.astro',
      'src/styles/shell.css',
      'src/styles/minimal.css',
    ];
    for (const entry of ['src/routes/posts-none.astro', 'src/routes/columns-none.astro']) {
      const graph = await dependencyGraph(entry);
      expect(graph, entry).not.toEqual(expect.arrayContaining(forbidden));
      expect(graph, entry).toContain('src/layouts/StandaloneLayout.astro');
    }
  });

  it('represents every chrome level in both first-class content collections', async () => {
    for (const collection of ['posts', 'columns'] as const) {
      const levels = new Set<string>();
      for (const file of await contentFiles(collection)) {
        const metadata = parseFrontmatter(await readFile(file, 'utf8'), file);
        if (typeof metadata.chrome === 'string') levels.add(metadata.chrome);
      }
      expect(levels).toEqual(new Set(['full', 'minimal', 'none']));
    }
  });

  it('keeps identity, themes and implemented portal navigation in typed registries', () => {
    expect(SITE.title).toBe('win98的小站');
    expect(SITE.github).toMatch(/^https:\/\/github\.com\//u);
    expect(THEMES).toEqual(['mist', 'abyss']);
    expect(PORTAL_NAVIGATION.map((item) => item.href)).toEqual([
      '/notes/', '/projects/', '/skills/', '/timeline/', '/tags/',
    ]);
  });

  it('keeps the static-first toolchain and full release gate explicit', async () => {
    const manifest = JSON.parse(await read('package.json')) as { dependencies: Record<string, string>; scripts: Record<string, string> };
    expect(manifest.scripts.build).toContain('pagefind');
    expect(manifest.scripts['verify:all']).toContain('test:e2e');
    expect(manifest.scripts['deploy:check']).toContain('deploy-check.mjs');
    expect(Object.keys(manifest.dependencies)).not.toEqual(expect.arrayContaining(['react', 'vue', 'svelte']));
  });

  it('ships the real brand and route-isolated standalone examples', async () => {
    await expect(access(join(root, 'public', 'brand', 'logo.jpg'))).resolves.toBeUndefined();
    await expect(access(join(root, 'public', 'favicon.svg'))).rejects.toThrow();
    await expect(access(join(root, 'src', 'content', 'posts', 'particle-field', 'index.mdx'))).resolves.toBeUndefined();
    await expect(access(join(root, 'src', 'content', 'columns', 'lab', 'index.mdx'))).resolves.toBeUndefined();
    await expect(access(join(root, 'src', 'content', 'columns', 'arcvellum', 'index.mdx'))).resolves.toBeUndefined();
  });
});
