import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRouteMetadata } from '../lib/frontmatter.mjs';

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
      'astro:config:setup': async ({ injectRoute, addWatchFile, command }) => {
        const sourceRoot = fileURLToPath(new URL('../content/', import.meta.url));
        for (const collection of ['posts', 'columns']) {
          const collectionRoot = join(sourceRoot, collection);
          for (const file of await discoverEntries(collectionRoot)) {
            addWatchFile(file);
            const source = await readFile(file, 'utf8');
            const { chrome, draft, publishAt } = readRouteMetadata(source, file);
            const unpublished = draft || (publishAt !== undefined && publishAt > Date.now());
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
