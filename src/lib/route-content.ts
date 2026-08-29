import { getCollection, getEntry, getEntries, render } from 'astro:content';
import { belongsToColumn, isPublished, relatedPosts, sortPosts } from './content';

function routeId(pathname: string, collection: 'posts' | 'columns') {
  const segments = decodeURIComponent(pathname).split('/').filter(Boolean);
  if (segments.shift() !== collection || segments.length === 0) {
    throw new Error(`Invalid ${collection} route: ${pathname}`);
  }
  return segments.join('/');
}

export async function loadPostRoute(pathname: string, expectedChrome: 'full' | 'minimal' | 'none') {
  const id = routeId(pathname, 'posts');
  const post = await getEntry('posts', id);
  if (!post || post.data.draft) throw new Error(`Post not found: ${id}`);
  if (post.data.chrome !== expectedChrome) {
    throw new Error(`Post ${id} was dispatched to ${expectedChrome}, but declares ${post.data.chrome}`);
  }
  const { Content, headings } = await render(post);
  const columns = await getEntries(post.data.columns);
  const allColumns = await getCollection('columns');
  const columnLookup = new Map(allColumns.map((column) => [column.id, column]));
  const posts = sortPosts((await getCollection('posts')).filter(isPublished));
  const index = posts.findIndex((entry) => entry.id === post.id);
  return {
    post,
    Content,
    headings,
    columns,
    columnLookup,
    related: relatedPosts(post, posts),
    previous: index >= 0 ? posts[index + 1] : undefined,
    next: index > 0 ? posts[index - 1] : undefined,
  };
}

export async function loadColumnRoute(pathname: string, expectedChrome: 'full' | 'minimal' | 'none') {
  const id = routeId(pathname, 'columns');
  const column = await getEntry('columns', id);
  if (!column || column.data.draft) throw new Error(`Column not found: ${id}`);
  if (column.data.chrome !== expectedChrome) {
    throw new Error(`Column ${id} was dispatched to ${expectedChrome}, but declares ${column.data.chrome}`);
  }
  const { Content } = await render(column);
  const posts = sortPosts(
    (await getCollection('posts'))
      .filter(isPublished)
      .filter((post) => belongsToColumn(post, column.id)),
  );
  return { column, Content, posts };
}
