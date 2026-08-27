import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../config/site';
import { isPublished, sortPosts } from '../lib/content';

export async function GET(context: { site: URL | undefined }) {
  const posts = sortPosts((await getCollection('posts')).filter(isPublished));
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? new URL('https://example.com'),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/posts/${post.id}/`,
      categories: post.data.tags,
    })),
  });
}
