import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { isPublished } from '../../../lib/content';
import { renderSocialCard } from '../../../lib/social-image';
import { postAccent } from '../../../lib/visual';

export const getStaticPaths = (async () => {
  const [posts, columns] = await Promise.all([getCollection('posts'), getCollection('columns')]);
  const columnLookup = new Map(columns.map((column) => [column.id, column]));
  return [
    ...posts.filter(isPublished).map((post) => ({ params: { collection: 'posts', slug: post.id }, props: { title: post.data.title, description: post.data.description, kind: 'post', theme: post.data.theme, accent: postAccent(post, columnLookup) } })),
    ...columns.filter(isPublished).map((column) => ({ params: { collection: 'columns', slug: column.id }, props: { title: column.data.title, description: column.data.description, kind: 'column', theme: column.data.theme, accent: column.data.accent } })),
  ];
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderSocialCard(props as Parameters<typeof renderSocialCard>[0]);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' } });
};
