export function GET({ site }: { site: URL | undefined }) {
  const root = site ?? new URL('https://example.com');
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap-index.xml', root).href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
