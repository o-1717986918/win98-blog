import { readdir, readFile, stat } from 'node:fs/promises';
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

  it('uses the supplied logo without deriving the independent dual-color system from it', async () => {
    const header = await read('src/components/chrome/SiteHeader.astro');
    const intro = await read('src/components/SiteIntro.astro');
    const base = await read('src/layouts/BaseLayout.astro');
    const manifest = await read('public/site.webmanifest');
    const tokens = await read('src/styles/tokens.css');
    const logo = await stat(join(root, 'public', 'brand', 'logo.jpg'));
    for (const source of [header, intro, base, manifest]) expect(source).toContain('/brand/logo.jpg');
    expect(logo.size).toBeGreaterThan(10_000);
    expect(tokens).toContain('--brand-primary-rgb: 101, 169, 244;');
    expect(tokens).toContain('--brand-secondary-rgb: 225, 139, 86;');
  });

  it('keeps publication, discovery and content operations in the static build', async () => {
    const config = await read('src/content.config.ts');
    const routes = await read('src/integrations/content-routes.mjs');
    const scripts = JSON.parse(await read('package.json')).scripts;
    expect(config).toContain('featured: z.boolean()');
    expect(config).toContain("comments: z.enum(['inherit', 'enabled', 'disabled'])");
    expect(routes).toContain('PREVIEW_DRAFTS');
    expect(routes).toContain('publishAt');
    expect(scripts['content:new']).toBeTruthy();
    expect(scripts['content:audit']).toBeTruthy();
    expect(scripts.build).toContain('pagefind');
    await expect(read('src/layouts/FullShell.astro')).resolves.not.toContain('SearchOverlay');
    await expect(read('src/components/chrome/SiteHeader.astro')).resolves.toContain('SearchIndex');
    await expect(read('src/components/SearchIndex.astro')).resolves.toContain('id="site-search"');
    await expect(read('src/components/SearchIndex.astro')).resolves.not.toContain('search-filters');
    await expect(read('src/pages/search.astro')).resolves.toContain('href="#site-search"');
    await expect(read('src/pages/tags/index.astro')).resolves.toContain('allTags');
  });

  it('keeps optional network adapters out of standalone content', async () => {
    const standalone = await read('src/layouts/StandaloneLayout.astro');
    expect(standalone).not.toMatch(/Analytics|Comments|AmbientField|ReaderControls/);
    for (const route of ['src/routes/posts-none.astro', 'src/routes/columns-none.astro']) {
      const source = await read(route);
      expect(source).not.toMatch(/Analytics|Comments|AmbientField|ReaderControls/);
    }
    await expect(read('src/components/Analytics.astro')).resolves.toContain('PUBLIC_ANALYTICS_PROVIDER');
    await expect(read('src/components/Comments.astro')).resolves.toContain('PUBLIC_COMMENTS_PROVIDER');
  });

  it('preserves the ambient field with user and system pause controls', async () => {
    const ambient = await read('src/components/AmbientField.astro');
    const engine = await read('src/lib/pixi-field.ts');
    expect(`${ambient}\n${engine}`).toContain('requestAnimationFrame');
    expect(ambient).toContain('data-motion-toggle');
    expect(ambient).toContain('prefers-reduced-motion');
    expect(ambient).toContain('visibilitychange');
    expect(ambient).toContain('someone-site:ambient-paused');
    expect(engine).toContain("from 'pixi.js'");
    expect(engine).toContain('pointermove');
    expect(engine).toContain('pointerdown');
    expect(engine).toContain('viewTargetX');
    expect(ambient).toContain('--view-x');
  });

  it('makes the homepage article surfaces native whole-card links', async () => {
    const home = await read('src/pages/index.astro');
    const list = await read('src/components/PostList.astro');
    expect(home).toContain('<a class="spotlight"');
    expect(list).toContain('<a class="post-row"');
    expect(home).not.toContain('spotlight-hitbox');
    expect(list).not.toContain('post-hitbox');
  });

  it('keeps the homepage intro session-scoped, skippable and motion-aware', async () => {
    const intro = await read('src/components/SiteIntro.astro');
    const particles = await read('src/lib/intro-particles.ts');
    const shell = await read('src/layouts/FullShell.astro');
    expect(intro).toContain('sessionStorage');
    expect(intro).toContain('data-intro-skip');
    expect(intro).toContain('prefers-reduced-motion');
    expect(intro).toContain("event.key === 'Escape'");
    expect(intro).toContain('mountIntroParticles');
    expect(intro).toContain('6800');
    expect(intro).not.toContain('clip-path: inset(0 100% 0 0)');
    expect(particles).toContain('sampleText');
    expect(particles).toContain('scatter');
    expect(shell).toContain("Astro.url.pathname === '/'");
  });

  it('ships production operations and deployment documentation', async () => {
    for (const path of [
      '.env.example',
      '.github/workflows/ci.yml',
      'docs/operations/CONTENT_WORKFLOW.md',
      'docs/operations/DEPLOYMENT.md',
      'docs/operations/OPERATIONS.md',
    ]) await expect(read(path)).resolves.toBeTruthy();
  });
});
