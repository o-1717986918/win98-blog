import { spawnSync } from 'node:child_process';
import process from 'node:process';

const image = process.env.CONTAINER_IMAGE?.trim() || 'win98-blog:local';
const siteUrl = process.env.SITE_URL?.trim() || 'https://docker.local.test';
const container = `win98-blog-smoke-${process.pid}`;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !options.allowFailure) {
    const detail = result.stderr?.trim() || result.stdout?.trim();
    throw new Error(`${command} ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
  return result;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitFor(check, label, timeout = 45_000) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await check();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError.message}` : ''}`);
}

async function response(path, expectedStatus = 200) {
  const result = await fetch(`${origin}${path}`, { redirect: 'manual' });
  assert(result.status === expectedStatus, `${path} returned ${result.status}, expected ${expectedStatus}`);
  return result;
}

let origin = '';

try {
  console.log(`Building ${image} for ${siteUrl}...`);
  run('docker', [
    'build',
    '--build-arg', `SITE_URL=${siteUrl}`,
    '--build-arg', 'BASE_PATH=/',
    '--tag', image,
    '.',
  ]);

  run('docker', [
    'run', '--detach', '--rm',
    '--name', container,
    '--read-only',
    '--tmpfs', '/tmp',
    '--tmpfs', '/var/cache/nginx',
    '--security-opt', 'no-new-privileges',
    '--cap-drop', 'ALL',
    '--publish', '127.0.0.1::8080',
    image,
  ]);

  const portOutput = run('docker', ['port', container, '8080/tcp'], { capture: true }).stdout.trim();
  const port = portOutput.match(/127\.0\.0\.1:(\d+)/u)?.[1];
  assert(port, `Docker did not publish a loopback port: ${portOutput}`);
  origin = `http://127.0.0.1:${port}`;

  await waitFor(async () => (await (await fetch(`${origin}/healthz`)).text()) === 'ok\n', 'container health endpoint');

  const homeResponse = await response('/');
  const home = await homeResponse.text();
  assert(home.includes('win98的小站'), 'home page is missing the site identity');
  assert(home.includes(`href="${siteUrl}/"`), 'home page canonical does not match SITE_URL');
  assert(home.includes('/brand/logo.jpg'), 'home page is missing the shared avatar asset');
  assert(homeResponse.headers.get('x-content-type-options') === 'nosniff', 'security headers are missing');
  assert(homeResponse.headers.get('content-security-policy')?.includes("object-src 'none'"), 'CSP baseline is missing');
  assert(homeResponse.headers.get('cache-control') === 'no-cache', 'HTML cache contract is missing');

  await response('/archive/');
  await response('/notes/');
  const pagefind = await response('/pagefind/pagefind.js');
  assert(pagefind.headers.get('cache-control')?.includes('max-age=604800'), 'Pagefind cache contract is missing');
  await response('/solver/solver-engine.wasm');
  await response('/this-route-must-not-exist/', 404);

  const assetPath = home.match(/(?:src|href)="([^"]*\/_astro\/[^"]+)"/u)?.[1];
  if (!assetPath) throw new Error('home page does not reference a hashed Astro asset');
  const asset = await response(new URL(assetPath, origin).pathname);
  assert(asset.headers.get('cache-control')?.includes('immutable'), 'hashed Astro assets are not immutable');

  const health = await waitFor(() => {
    const result = run('docker', ['inspect', '--format', '{{.State.Health.Status}}', container], { capture: true });
    return result.stdout.trim() === 'healthy';
  }, 'Docker HEALTHCHECK');
  assert(health, 'Docker HEALTHCHECK did not become healthy');

  console.log(`Container verification passed at ${origin}.`);
} finally {
  run('docker', ['rm', '--force', container], { allowFailure: true, capture: true });
}
