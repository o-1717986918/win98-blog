import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../config/site';
import { isPublished, sortPosts } from '../lib/content';
import { withBase } from '../lib/site-path';

export async function GET(context: { site: URL | undefined }) {
  const posts = sortPosts((await getCollection('posts')).filter(isPublished));
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: new URL(withBase('/'), context.site ?? new URL('https://example.com')),
    customData: `<language>${SITE.language}</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: withBase(`/posts/${post.id}/`),
      categories: post.data.tags,
      author: SITE.author,
      customData: post.data.updated ? `<atom:updated>${post.data.updated.toISOString()}</atom:updated>` : undefined,
    })),
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
  });
}
