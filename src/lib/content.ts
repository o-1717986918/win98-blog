import type { CollectionEntry } from 'astro:content';

export type PostEntry = CollectionEntry<'posts'>;
export type ColumnEntry = CollectionEntry<'columns'>;

export const isPublished = <T extends { data: { draft: boolean } }>(entry: T) => !entry.data.draft;

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
