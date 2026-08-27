import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = new Set(['full', 'minimal', 'none']);

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

function readRouteMetadata(source, file) {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/u)?.[1] ?? '';
  const chrome = frontmatter.match(/^chrome:\s*(full|minimal|none)\s*$/mu)?.[1] ?? 'full';
  const draft = /^draft:\s*true\s*$/mu.test(frontmatter);
  const rawDate = frontmatter.match(/^date:\s*([^\r\n#]+)\s*$/mu)?.[1]?.trim();
  const publishAt = rawDate ? Date.parse(rawDate) : undefined;
  if (!CHROME.has(chrome)) throw new Error(`Unsupported chrome value in ${file}`);
  if (rawDate && Number.isNaN(publishAt)) throw new Error(`Invalid date in ${file}`);
  return { chrome, draft, publishAt };
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
