import { readdir, readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { parseFrontmatter } from '../src/lib/frontmatter.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const contentRoot = resolve(root, 'src', 'content');
const failures = [];
const assets = [];
let defaults = 0;

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (/^index\.(?:md|mdx)$/u.test(entry.name)) files.push(path);
  }
  return files;
}

for (const collection of ['posts', 'columns']) {
  const base = resolve(contentRoot, collection);
  for (const file of await walk(base)) {
    const label = `${collection}/${relative(base, dirname(file)).replaceAll('\\', '/')}`;
    const data = parseFrontmatter(await readFile(file, 'utf8'), file);
    if (!data.cover) { defaults += 1; continue; }
    if (typeof data.cover !== 'object' || Array.isArray(data.cover) || typeof data.cover.src !== 'string' || typeof data.cover.alt !== 'string' || !data.cover.alt.trim()) {
      failures.push(`${label}: cover 必须包含 src 与非空 alt`);
      continue;
    }
    const path = resolve(dirname(file), data.cover.src);
    try {
      const { width = 0, height = 0, format } = await sharp(path).metadata();
      const ratio = height ? width / height : 0;
      if (width < 1200 || height < 630) failures.push(`${label}: 封面至少需要 1200×630，当前 ${width}×${height}`);
      if (ratio < 1.5 || ratio > 2.2) failures.push(`${label}: 封面宽高比应在 1.5–2.2，当前 ${ratio.toFixed(2)}`);
      assets.push({ label, width, height, format });
    } catch (error) {
      failures.push(`${label}: 无法读取封面 ${data.cover.src}（${error instanceof Error ? error.message : String(error)}）`);
    }
  }
}

if (failures.length) {
  console.error('Cover audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Cover audit passed: ${assets.length} real covers, ${defaults} deterministic defaults.`);
  assets.forEach(({ label, width, height, format }) => console.log(`- ${label}: ${width}×${height} ${format}`));
}
