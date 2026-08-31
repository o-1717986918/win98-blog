import { readdir, readFile } from 'node:fs/promises';
import { basename, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRouteMetadata } from '../lib/frontmatter.mjs';
import { publicationTimestamp } from '../lib/publication-clock.mjs';

const watcherMarker = Symbol.for('someone-site.content-route-watcher');

export function isContentEntry(path, roots) {
  const target = resolve(path);
  return /^index\.(md|mdx)$/u.test(basename(target))
    && roots.some((root) => target.startsWith(`${resolve(root)}${sep}`));
}

export function contentRouteWatcher(roots) {
  return {
    name: 'someone-site-content-route-watcher',
    configureServer(server) {
      if (server[watcherMarker]) return;
      server[watcherMarker] = true;
      let restarting = false;
      server.watcher.on('add', async (path) => {
        if (restarting || !isContentEntry(path, roots)) return;
        restarting = true;
        try { await server.restart(); }
        finally { restarting = false; }
      });
    },
  };
}

async function discoverEntries(root) {
  const files = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/^index\.(md|mdx)$/.test(entry.name)) files.push(path);
    }
  }
  await walk(root);
  return files;
}

export default function contentRoutes() {
  return {
    name: 'someone-site-content-routes',
    hooks: {
      'astro:config:setup': async ({ injectRoute, addWatchFile, updateConfig, command }) => {
        const sourceRoot = fileURLToPath(new URL('../content/', import.meta.url));
        const collectionRoots = ['posts', 'columns'].map((collection) => join(sourceRoot, collection));
        if (command === 'dev') updateConfig({ vite: { plugins: [contentRouteWatcher(collectionRoots)] } });
        for (const collection of ['posts', 'columns']) {
          const collectionRoot = join(sourceRoot, collection);
          for (const file of await discoverEntries(collectionRoot)) {
            addWatchFile(file);
            const source = await readFile(file, 'utf8');
            const { chrome, draft, publishAt } = readRouteMetadata(source, file, collection);
            const unpublished = draft || (publishAt !== undefined && publishAt > publicationTimestamp);
            if (unpublished && command === 'build' && process.env.PREVIEW_DRAFTS !== 'true') continue;
            const id = relative(collectionRoot, file)
              .split(sep)
              .slice(0, -1)
              .join('/');
            injectRoute({
              pattern: `/${collection}/${id}`,
              entrypoint: new URL(`../routes/${collection}-${chrome}.astro`, import.meta.url),
              prerender: true,
            });
          }
        }
      },
    },
  };
}
