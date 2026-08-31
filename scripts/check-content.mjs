import { access, readdir, readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../src/lib/frontmatter.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const contentRoot = resolve(root, 'src', 'content');
const failures = [];
const notes = [];
const featuredPosts = [];

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
const publicNoteIds = new Set();
const titles = new Map();
const noteNames = new Map();
const publicNoteNames = new Map();
const routes = new Set(['/', '/archive/', '/about/', '/search/', '/tags/', '/notes/', '/privacy/', '/rss.xml']);
for (const id of postIds) routes.add(`/posts/${id}/`);
for (const id of columnIds) routes.add(`/columns/${id}/`);

for (const file of noteEntries.files) {
  const id = relative(noteEntries.base, dirname(file)).replaceAll('\\', '/');
  const source = await readFile(file, 'utf8');
  const meta = metadata(source, file);
  const isPublic = meta.value('publish') === true && meta.value('draft') !== true;
  if (isPublic) {
    publicNoteIds.add(id);
    routes.add(`/notes/${id}/`);
  }
  for (const name of [meta.value('title'), ...meta.list('aliases')]) {
    const normalized = String(name ?? '').trim().toLowerCase();
    if (normalized) {
      noteNames.set(normalized, id);
      if (isPublic) publicNoteNames.set(normalized, id);
    }
  }
}

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
      const format = String(meta.value('format') ?? 'essay');
      const bodyCharacters = meta.body.replace(/\s/gu, '').length;
      if (format === 'essay' && meta.value('draft') !== true && bodyCharacters < 1200) failures.push(`${label}: essay 正文不足 1200 个非空白字符；短内容请明确使用 field-note 或 experiment`);
      if (String(title ?? '').length > 32 && !meta.value('shortTitle')) failures.push(`${label}: 长标题需要 shortTitle（最多 32 字）`);
      if (meta.value('featured') === true) {
        featuredPosts.push(label);
        if (!Array.isArray(meta.value('evidence')) || meta.value('evidence').length === 0) failures.push(`${label}: featured 文章至少需要一条 evidence`);
      }
      const referencedColumns = meta.list('columns');
      if (referencedColumns.length === 0 && meta.value('draft') !== true) failures.push(`${label}: 已发布文章至少需要一个主题引用`);
      for (const column of referencedColumns) if (!columnIds.has(column)) failures.push(`${label}: 主题引用 ${column} 不存在`);
      const date = meta.value('date');
      if (!date || Number.isNaN(Date.parse(date))) failures.push(`${label}: date 无效`);
      else if (Date.parse(date) > Date.now()) notes.push(`${label}: 定时发布 ${date}`);
      if (meta.value('draft') === true) notes.push(`${label}: 草稿`);
    }
    if (collection === 'notes') {
      const isPublic = meta.value('publish') === true && meta.value('draft') !== true;
      const created = meta.value('created');
      if (!created || Number.isNaN(Date.parse(created))) failures.push(`${label}: created 无效`);
      if (!['seedling', 'growing', 'evergreen'].includes(String(meta.value('maturity') ?? ''))) failures.push(`${label}: maturity 必须是 seedling / growing / evergreen`);
      for (const target of meta.list('relations')) {
        if (!noteIds.has(target)) failures.push(`${label}: 显式关系 ${target} 不存在`);
        else if (isPublic && !publicNoteIds.has(target)) failures.push(`${label}: 公开笔记不能引用未公开关系 ${target}`);
        if (target === id) failures.push(`${label}: 不允许关系指向自身`);
      }
      const linkableBody = meta.body.replace(/```[\s\S]*?```/gu, '').replace(/~~~[\s\S]*?~~~/gu, '').replace(/`[^`\r\n]*`/gu, '');
      for (const link of linkableBody.matchAll(/(?<!!)\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/gu)) {
        const target = String(link[1]).trim().toLowerCase();
        const visibleNames = isPublic ? publicNoteNames : noteNames;
        if (!visibleNames.has(target)) failures.push(`${label}: Wiki 链接目标不存在或不可公开 ${link[1]}`);
      }
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

if (featuredPosts.length > 1) failures.push(`featured 文章只能有一篇，当前为：${featuredPosts.join(', ')}`);

if (failures.length) {
  console.error('Content audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Content audit passed: ${postIds.size} posts, ${columnIds.size} themes and ${noteIds.size} notes.`);
  notes.forEach((note) => console.log(`- ${note}`));
}
