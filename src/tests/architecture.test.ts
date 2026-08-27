import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path: string) => readFile(join(root, path), 'utf8');

async function contentFiles(collection: 'posts' | 'columns') {
  const collectionRoot = join(root, 'src', 'content', collection);
  const files: string[] = [];
  async function walk(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/^index\.(md|mdx)$/.test(entry.name)) files.push(path);
    }
  }
  await walk(collectionRoot);
  return files;
}

describe('blog-architecture contracts', () => {
  it('keeps BaseLayout free of visual chrome and global styles', async () => {
    const source = await read('src/layouts/BaseLayout.astro');
    expect(source).not.toMatch(/styles\//);
    expect(source).not.toMatch(/SiteHeader|SiteFooter|ReaderControls|AmbientField|BackBadge/);
    expect(source).toContain('<slot />');
  });

  it('dispatches every content route to one build-time chrome entrypoint', async () => {
    const integration = await read('src/integrations/content-routes.mjs');
    expect(integration).toContain('${collection}-${chrome}.astro');
    expect(integration).toContain('injectRoute');
    await expect(read('src/routes/posts-none.astro')).resolves.not.toMatch(/PostLayout|MinimalPostLayout|FullShell/);
    await expect(read('src/routes/columns-none.astro')).resolves.not.toMatch(/ColumnLayout|MinimalColumnLayout|FullShell/);
  });

  it('models columns separately from chrome and validates post references', async () => {
    const config = await read('src/content.config.ts');
    expect(config).toContain("columns: z.array(reference('columns'))");
    expect(config).toContain("const chrome = z.enum(['full', 'minimal', 'none'])");
    expect(config.match(/\n\s+chrome,/g)?.length).toBe(2);

    const columnFiles = await contentFiles('columns');
    const columnRoot = join(root, 'src', 'content', 'columns');
    const columnIds = new Set(columnFiles.map((file) => relative(columnRoot, file).split('\\').slice(0, -1).join('/')));
    const postFiles = await contentFiles('posts');
    for (const file of postFiles) {
      const source = await readFile(file, 'utf8');
      const block = source.match(/^columns:\s*\r?\n((?:\s+-\s+[^\r\n]+\r?\n?)+)/mu)?.[1] ?? '';
      const inline = source.match(/^columns:\s*\[([^\]]*)\]\s*$/mu)?.[1] ?? '';
      const references = block
        ? [...block.matchAll(/^\s+-\s+([^\s#]+)\s*$/gmu)].map((match) => match[1]!)
        : inline.split(',').map((value) => value.trim()).filter(Boolean);
      expect(references.length, `${relative(root, file)} must reference at least one column`).toBeGreaterThan(0);
      for (const id of references) expect(columnIds.has(id), `${id} must name an existing column`).toBe(true);
    }
  });

  it('has full, minimal and none representatives for both posts and columns', async () => {
    for (const collection of ['posts', 'columns'] as const) {
      const values = new Set<string>();
      for (const file of await contentFiles(collection)) {
        const source = await readFile(file, 'utf8');
        const chrome = source.match(/^chrome:\s*(full|minimal|none)\s*$/mu)?.[1];
        if (chrome) values.add(chrome);
      }
      expect(values).toEqual(new Set(['full', 'minimal', 'none']));
    }
  });

  it('uses the exact public identity in formal source', async () => {
    const site = await read('src/config/site.ts');
    expect(site).toContain("title: '某人的小站'");
    expect(site).not.toMatch(/文书手记|文枢手记/);
  });
});
