import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import { defineConfig } from 'astro/config';
import contentRoutes from './src/integrations/content-routes.mjs';

export default defineConfig({
  site: process.env.SITE_URL ?? 'http://localhost:4321',
  base: process.env.BASE_PATH ?? '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    contentRoutes(),
    expressiveCode({
      themes: ['github-light', 'github-dark'],
      useThemedScrollbars: true,
      styleOverrides: {
        borderRadius: '3px',
        codeFontFamily: 'var(--font-mono)',
      },
    }),
    mdx(),
    sitemap(),
  ],
});
