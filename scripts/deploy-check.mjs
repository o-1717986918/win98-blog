import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const failures = [];
const siteUrl = process.env.SITE_URL ?? '';
try {
  const parsed = new URL(siteUrl);
  if (parsed.protocol !== 'https:') failures.push('SITE_URL must use https');
  if (parsed.hostname === 'example.com') failures.push('SITE_URL still points to example.com');
  if (parsed.pathname !== '/') failures.push('SITE_URL must be an origin without a path');
} catch { failures.push('SITE_URL must be a valid absolute production URL'); }

const required = (provider, names) => {
  for (const name of names) if (!process.env[name]) failures.push(`${name} is required when ${provider} is selected`);
};
const comments = process.env.PUBLIC_COMMENTS_PROVIDER ?? 'none';
if (comments === 'giscus') required('giscus', ['PUBLIC_GISCUS_REPO', 'PUBLIC_GISCUS_REPO_ID', 'PUBLIC_GISCUS_CATEGORY', 'PUBLIC_GISCUS_CATEGORY_ID']);
if (comments === 'waline') required('waline', ['PUBLIC_WALINE_SERVER_URL']);
if (!['none', 'giscus', 'waline'].includes(comments)) failures.push(`unknown comments provider: ${comments}`);
const analytics = process.env.PUBLIC_ANALYTICS_PROVIDER ?? 'none';
if (analytics === 'cloudflare') required('cloudflare', ['PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN']);
if (analytics === 'umami') required('umami', ['PUBLIC_UMAMI_SCRIPT_URL', 'PUBLIC_UMAMI_WEBSITE_ID']);
if (!['none', 'cloudflare', 'umami'].includes(analytics)) failures.push(`unknown analytics provider: ${analytics}`);

try {
  await access(resolve(root, 'dist', 'index.html'));
  const home = await readFile(resolve(root, 'dist', 'index.html'), 'utf8');
  if (siteUrl && !home.includes(`href="${siteUrl}/"`)) failures.push('dist was not built with the current SITE_URL');
} catch { failures.push('dist/index.html is missing; run pnpm build first'); }

if (failures.length) {
  console.error('Deployment preflight failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Deployment preflight passed for ${siteUrl}`);
}
