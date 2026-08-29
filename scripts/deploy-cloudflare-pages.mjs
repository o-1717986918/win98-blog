import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const target = process.argv[2];

if (target !== 'preview' && target !== 'production') {
  console.error('Usage: node scripts/deploy-cloudflare-pages.mjs <preview|production>');
  process.exit(2);
}

if (target === 'production' && process.env.CONFIRM_PRODUCTION !== 'YES') {
  console.error('Production deployment refused. Set CONFIRM_PRODUCTION=YES for this command only.');
  process.exit(2);
}

const project = process.env.CLOUDFLARE_PAGES_PROJECT?.trim();
const productionBranch = process.env.CLOUDFLARE_PRODUCTION_BRANCH?.trim() || 'main';
const previewBranch = process.env.DEPLOY_BRANCH?.trim() || 'manual-preview';
const branch = target === 'production' ? productionBranch : previewBranch;

if (!project) {
  console.error('CLOUDFLARE_PAGES_PROJECT is missing. Run pnpm deploy:prepare first.');
  process.exit(2);
}

console.log(`Uploading dist to Cloudflare Pages project ${project} as ${target} branch ${branch}.`);
const pnpmCli = process.env.npm_execpath;
if (!pnpmCli) {
  console.error('Deployment must be started with a pnpm deploy:pages:* command.');
  process.exit(2);
}
const deploy = spawnSync(process.execPath, [
  pnpmCli, 'dlx', 'wrangler@4.127.0', 'pages', 'deploy', 'dist',
  `--project-name=${project}`,
  `--branch=${branch}`,
], { cwd: root, env: process.env, stdio: 'inherit' });

if (deploy.error) throw deploy.error;
process.exitCode = deploy.status ?? 1;
