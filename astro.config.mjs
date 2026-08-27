import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import contentRoutes from './src/integrations/content-routes.mjs';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://example.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [contentRoutes(), mdx(), sitemap()],
});
