import { getCollection } from 'astro:content';
import { SITE } from '../config/site';
import { isPublished, sortColumns, sortPosts } from '../lib/content';

export async function GET({ site }: { site: URL | undefined }) {
  const root = site ?? new URL('https://example.com');
  const posts = sortPosts((await getCollection('posts')).filter(isPublished));
  const columns = sortColumns((await getCollection('columns')).filter(isPublished));
  const absolute = (path: string) => new URL(path, root).href;
  const lines = [
    `# ${SITE.title}`,
    '',
    `> ${SITE.description}`,
    '',
    '## 主要入口',
    `- [首页](${absolute('/')})`,
    `- [文章归档](${absolute('/archive/')})`,
    `- [主题](${absolute('/#columns-heading')})`,
    `- [RSS](${absolute('/rss.xml')})`,
    '',
    '## 主题',
    ...columns.map((column) => `- [${column.data.title}](${absolute(`/columns/${column.id}/`)}): ${column.data.description}`),
    '',
    '## 文章',
    ...posts.map((post) => `- [${post.data.title}](${absolute(`/posts/${post.id}/`)}): ${post.data.description}`),
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
