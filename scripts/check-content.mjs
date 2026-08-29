import { access, readdir, readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../src/lib/frontmatter.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const contentRoot = resolve(root, 'src', 'content');
const failures = [];
const notes = [];

async function findEntries(collection) {
  const base = resolve(contentRoot, collection);
  const files = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/^index\.(md|mdx)$/u.test(entry.name)) files.push(path);
    }
  }
  await walk(base);
  return { base, files };
}

function metadata(source, file) {
  const data = parseFrontmatter(source, file);
  const body = source.slice(source.indexOf('---', 3) + 3);
  const value = (key) => data[key];
  const list = (key) => Array.isArray(data[key]) ? data[key].map(String) : [];
  return { data, body, value, list };
}

const posts = await findEntries('posts');
const columns = await findEntries('columns');
const noteEntries = await findEntries('notes');
const postIds = new Set(posts.files.map((file) => relative(posts.base, dirname(file)).replaceAll('\\', '/')));
const columnIds = new Set(columns.files.map((file) => relative(columns.base, dirname(file)).replaceAll('\\', '/')));
const noteIds = new Set(noteEntries.files.map((file) => relative(noteEntries.base, dirname(file)).replaceAll('\\', '/')));
const titles = new Map();
const routes = new Set(['/', '/archive/', '/about/', '/search/', '/tags/', '/notes/', '/privacy/', '/rss.xml']);
for (const id of postIds) routes.add(`/posts/${id}/`);
for (const id of columnIds) routes.add(`/columns/${id}/`);
for (const id of noteIds) routes.add(`/notes/${id}/`);

const collections = [
  { name: 'posts', files: posts.files, base: posts.base },
  { name: 'columns', files: columns.files, base: columns.base },
  { name: 'notes', files: noteEntries.files, base: noteEntries.base },
];
for (const { name: collection, files, base } of collections) {
  for (const file of files) {
    const id = relative(base, dirname(file)).replaceAll('\\', '/');
    const label = `${collection}/${id}`;
    if (id.split('/').some((part) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(part))) failures.push(`${label}: slug 不合法`);
    const source = await readFile(file, 'utf8');
    const meta = metadata(source, file);
    const title = meta.value('title');
    if (!title) failures.push(`${label}: 缺少 title`);
    else if (titles.has(`${collection}:${title}`)) failures.push(`${label}: title 与 ${titles.get(`${collection}:${title}`)} 重复`);
    else titles.set(`${collection}:${title}`, label);

    if (collection === 'posts') {
      const referencedColumns = meta.list('columns');
      if (referencedColumns.length === 0 && meta.value('draft') !== true) failures.push(`${label}: 已发布文章至少需要一个主题引用`);
      for (const column of referencedColumns) if (!columnIds.has(column)) failures.push(`${label}: 主题引用 ${column} 不存在`);
      const date = meta.value('date');
      if (!date || Number.isNaN(Date.parse(date))) failures.push(`${label}: date 无效`);
      else if (Date.parse(date) > Date.now()) notes.push(`${label}: 定时发布 ${date}`);
      if (meta.value('draft') === true) notes.push(`${label}: 草稿`);
    }
    if (collection === 'notes') {
      const created = meta.value('created');
      if (!created || Number.isNaN(Date.parse(created))) failures.push(`${label}: created 无效`);
      if (meta.value('publish') !== true) notes.push(`${label}: 私有笔记，不进入公开路由`);
      if (meta.value('draft') === true) notes.push(`${label}: 草稿`);
    }

    for (const image of meta.body.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/gu)) {
      if (!image[1]?.trim()) failures.push(`${label}: Markdown 图片缺少 alt（${image[2]}）`);
    }
    for (const image of meta.body.matchAll(/<img\b([^>]*)>/giu)) {
      if (!/\balt\s*=\s*["'][^"']+["']/iu.test(image[1] ?? '')) failures.push(`${label}: HTML img 缺少非空 alt`);
    }
    for (const imported of source.matchAll(/from\s+["'](\.\/[^"']+)["']/gu)) {
      try { await access(resolve(dirname(file), imported[1])); }
      catch { failures.push(`${label}: 私有导入不存在 ${imported[1]}`); }
    }
    for (const link of meta.body.matchAll(/\[[^\]]+\]\((\/[^)\s#?]+)[^)]*\)/gu)) {
      const route = link[1].endsWith('/') || link[1].includes('.') ? link[1] : `${link[1]}/`;
      if (!routes.has(route) && !route.startsWith('/tags/')) failures.push(`${label}: 内部链接不存在 ${link[1]}`);
    }
  }
}

if (failures.length) {
  console.error('Content audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Content audit passed: ${postIds.size} posts, ${columnIds.size} themes and ${noteIds.size} notes.`);
  notes.forEach((note) => console.log(`- ${note}`));
}
