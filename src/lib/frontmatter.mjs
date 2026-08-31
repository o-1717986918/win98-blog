import { parse } from 'yaml';
import { z } from 'astro/zod';

export const CHROME_LEVELS = ['full', 'minimal', 'none'];
export const chromeSchema = z.enum(CHROME_LEVELS).default('full');
export const draftSchema = z.boolean().default(false);
const routeSchemas = {
  posts: z.object({ chrome: chromeSchema, draft: draftSchema, date: z.coerce.date() }),
  columns: z.object({ chrome: chromeSchema, draft: draftSchema }),
};

export function parseFrontmatter(source, file = 'content entry') {
  const block = source.match(/^---\r?\n([\s\S]*?)\r?\n---/u)?.[1];
  if (block === undefined) return {};
  let data;
  try {
    data = parse(block);
  } catch (error) {
    throw new Error(`Invalid frontmatter in ${file}: ${error.message}`, { cause: error });
  }
  if (data === null || data === undefined) return {};
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`Frontmatter in ${file} must be a mapping`);
  }
  return data;
}

export function readRouteMetadata(source, file, collection) {
  const data = parseFrontmatter(source, file);
  const schema = routeSchemas[collection];
  if (!schema) throw new Error(`Unsupported content collection: ${collection}`);
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join('.') || 'frontmatter'}: ${issue.message}`).join('; ');
    throw new Error(`Invalid route metadata in ${file}: ${details}`);
  }
  return {
    chrome: result.data.chrome,
    draft: result.data.draft,
    publishAt: 'date' in result.data ? result.data.date.getTime() : undefined,
  };
}
