import { parse } from 'yaml';

const CHROME = new Set(['full', 'minimal', 'none']);

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

export function readRouteMetadata(source, file) {
  const data = parseFrontmatter(source, file);
  const chrome = data.chrome ?? 'full';
  if (typeof chrome !== 'string' || !CHROME.has(chrome)) {
    throw new Error(`Unsupported chrome value in ${file}`);
  }
  if (data.draft !== undefined && typeof data.draft !== 'boolean') {
    throw new Error(`draft must be boolean in ${file}`);
  }
  const rawDate = data.date;
  const publishAt = rawDate === undefined || rawDate === null || rawDate === ''
    ? undefined
    : Date.parse(rawDate instanceof Date ? rawDate.toISOString() : String(rawDate));
  if (publishAt !== undefined && Number.isNaN(publishAt)) {
    throw new Error(`Invalid date in ${file}`);
  }
  return { chrome, draft: data.draft === true, publishAt };
}
