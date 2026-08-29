const failures = [];
const required = ['CLOUDFLARE_PAGES_PROJECT', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'];

for (const name of required) {
  if (!process.env[name]?.trim()) failures.push(`${name} is required for Cloudflare Pages deployment`);
}

const project = process.env.CLOUDFLARE_PAGES_PROJECT?.trim() ?? '';
if (project && (!/^(?:[a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9])$/.test(project) || project.length > 58)) {
  failures.push('CLOUDFLARE_PAGES_PROJECT must be 1-58 lowercase letters, digits or hyphens');
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? '';
if (accountId && !/^[a-f0-9]{32}$/i.test(accountId)) failures.push('CLOUDFLARE_ACCOUNT_ID must be a 32-character hexadecimal account ID');

const productionBranch = process.env.CLOUDFLARE_PRODUCTION_BRANCH?.trim() || 'main';
const previewBranch = process.env.DEPLOY_BRANCH?.trim() || 'manual-preview';

if (failures.length) {
  console.error('Cloudflare deployment configuration failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Cloudflare deployment configuration passed for ${project} (target branch ${previewBranch}; production branch ${productionBranch}).`);
}
