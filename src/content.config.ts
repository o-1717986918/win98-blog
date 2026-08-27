import { defineCollection, reference, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const contentId = ({ entry }: { entry: string }) =>
  entry.replaceAll('\\', '/').replace(/\/index\.(md|mdx)$/i, '');

const chrome = z.enum(['full', 'minimal', 'none']).default('full');
const theme = z.enum(['graphite', 'paper', 'night', 'indigo']).default('graphite');
const cover = ({ image }: SchemaContext) => z.object({
  src: image(),
  alt: z.string().min(1),
});

const columns = defineCollection({
  loader: glob({
    pattern: '**/index.{md,mdx}',
    base: './src/content/columns',
    generateId: contentId,
  }),
  schema: ({ image }) => z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    cover: cover({ image }).optional(),
    chrome,
    theme,
    back: z.boolean().default(true),
    nav: z.boolean().default(false),
    navLabel: z.string().min(1).optional(),
    order: z.number().int().default(0),
    showPosts: z.boolean().default(true),
    draft: z.boolean().default(false),
  }),
});

const posts = defineCollection({
  loader: glob({
    pattern: '**/index.{md,mdx}',
    base: './src/content/posts',
    generateId: contentId,
  }),
  schema: ({ image }) => z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    cover: cover({ image }).optional(),
    tags: z.array(z.string().min(1)).default([]),
    columns: z.array(reference('columns')).default([]),
    featured: z.boolean().default(false),
    comments: z.enum(['inherit', 'enabled', 'disabled']).default('inherit'),
    noindex: z.boolean().default(false),
    license: z.string().min(1).default('CC BY-NC-SA 4.0'),
    chrome,
    theme,
    back: z.boolean().default(true),
    wide: z.boolean().default(false),
    hideToc: z.boolean().default(false),
    minutes: z.number().int().positive().optional(),
    draft: z.boolean().default(false),
  }).superRefine((post, context) => {
    if (post.updated && post.updated < post.date) {
      context.addIssue({
        code: 'custom',
        path: ['updated'],
        message: 'updated 不能早于 date',
      });
    }
  }),
});

export const collections = { columns, posts };
