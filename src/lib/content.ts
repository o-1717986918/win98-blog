import type { CollectionEntry } from 'astro:content';
import { withBase } from './site-path';

export type PostEntry = CollectionEntry<'posts'>;
export type ColumnEntry = CollectionEntry<'columns'>;

const previewUnpublished = import.meta.env.DEV || import.meta.env.PREVIEW_DRAFTS === 'true';

export const isPublished = <T extends { data: { draft: boolean; date?: Date } }>(entry: T) =>
  previewUnpublished || (!entry.data.draft && (!entry.data.date || entry.data.date.getTime() <= Date.now()));

export const sortPosts = (posts: PostEntry[]) =>
  [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

export const sortColumns = (columns: ColumnEntry[]) =>
  [...columns].sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title, 'zh-CN'));

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

export const belongsToColumn = (post: PostEntry, columnId: string) =>
  post.data.columns.some((column) => column.id === columnId);

export const allTags = (posts: PostEntry[]) => {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
};

export const tagPath = (tag: string) => withBase(`/tags/${encodeURIComponent(tag)}/`);

export const relatedPosts = (target: PostEntry, posts: PostEntry[], limit = 3) => {
  const targetColumns = new Set(target.data.columns.map((column) => column.id));
  const targetTags = new Set(target.data.tags);
  return posts
    .filter((post) => post.id !== target.id)
    .map((post) => ({
      post,
      score:
        post.data.columns.filter((column) => targetColumns.has(column.id)).length * 3
        + post.data.tags.filter((tag) => targetTags.has(tag)).length * 2,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.post.data.date.getTime() - a.post.data.date.getTime())
    .slice(0, limit)
    .map(({ post }) => post);
};
