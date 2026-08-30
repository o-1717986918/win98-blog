import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createContentPathPolicy } from './path-policy.mjs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const studioRoot = resolve(root, 'tools', 'blog-studio');
const allowedRoots = ['src/content/posts', 'src/content/columns', 'src/content/notes'];
const port = Number(process.env.BLOG_STUDIO_PORT ?? 4317);
const token = process.env.BLOG_STUDIO_TOKEN ?? randomBytes(18).toString('base64url');
const contentTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const contentPaths = await createContentPathPolicy(root, allowedRoots);

function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(value));
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 2_000_000) throw new Error('请求超过 2 MB 限制');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

async function tree() {
  const result = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      if (entry.isSymbolicLink()) continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/index\.(?:md|mdx)$/iu.test(entry.name)) result.push(relative(root, path).replaceAll('\\', '/'));
    }
  }
  for (const base of allowedRoots) await walk(resolve(root, base));
  return result.sort((a, b) => a.localeCompare(b));
}

function run(command, args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { cwd: root, shell: false, windowsHide: true });
    const chunks = [];
    child.stdout.on('data', (data) => chunks.push(data));
    child.stderr.on('data', (data) => chunks.push(data));
    child.on('error', rejectRun);
    child.on('close', (code) => resolveRun({ code, output: Buffer.concat(chunks).toString('utf8').slice(-120_000) }));
  });
}

const commands = new Set(['audit', 'covers', 'test', 'build', 'verify']);
const commandScripts = { audit: 'content:audit', covers: 'content:covers', test: 'test', build: 'build', verify: 'verify' };

async function api(request, response, url) {
  const supplied = request.headers['x-blog-studio-token'] ?? url.searchParams.get('token');
  if (supplied !== token) return json(response, 401, { error: '无效的本地 Studio token' });
  if (request.method === 'GET' && url.pathname === '/api/tree') return json(response, 200, { files: await tree() });
  if (request.method === 'GET' && url.pathname === '/api/file') {
    const path = await contentPaths.existing(url.searchParams.get('path'));
    if (!path) return json(response, 400, { error: '路径不在允许的内容目录内' });
    return json(response, 200, { path: relative(root, path).replaceAll('\\', '/'), content: await readFile(path, 'utf8') });
  }
  if (request.method === 'PUT' && url.pathname === '/api/file') {
    const body = await readBody(request); const path = await contentPaths.existing(body.path);
    if (!path || typeof body.content !== 'string') return json(response, 400, { error: '文件或内容无效' });
    const temporary = `${path}.studio-tmp`;
    await writeFile(temporary, body.content, 'utf8'); await rename(temporary, path);
    return json(response, 200, { ok: true, path: relative(root, path).replaceAll('\\', '/') });
  }
  if (request.method === 'POST' && url.pathname === '/api/create') {
    const body = await readBody(request); const kind = String(body.kind ?? 'post');
    const collection = { post: 'posts', theme: 'columns', note: 'notes' }[kind];
    const slug = String(body.slug ?? '').toLowerCase();
    if (!collection || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) return json(response, 400, { error: '类型或 slug 无效' });
    const path = await contentPaths.newFile(`src/content/${collection}/${slug}/index.md`);
    if (!path) return json(response, 400, { error: '新内容路径无效' });
    try { await stat(path); return json(response, 409, { error: '内容已存在' }); } catch {}
    const title = JSON.stringify(String(body.title ?? slug));
    const today = new Date().toISOString().slice(0, 10);
    const templates = {
      post: `---\ntitle: ${title}\ndescription: ""\ndate: ${today}\nformat: essay\ntags: []\ncolumns: []\nevidence: []\nsyndication: []\ndraft: true\n---\n\n从这里开始写作。\n`,
      theme: `---\ntitle: ${title}\ndescription: ""\nchrome: full\ntheme: abyss\naccent: aqua\nnav: false\norder: 100\nshowPosts: true\ndraft: true\n---\n\n说明这个主题收录什么。\n`,
      note: `---\ntitle: ${title}\ndescription: ""\ncreated: ${today}\ntags: []\naliases: []\nmaturity: seedling\nrelations: []\npublish: false\ndraft: false\n---\n\n从这里开始记录。\n`,
    };
    await mkdir(resolve(path, '..'), { recursive: true }); await writeFile(path, templates[kind], 'utf8');
    return json(response, 201, { path: relative(root, path).replaceAll('\\', '/') });
  }
  if (request.method === 'POST' && url.pathname === '/api/run') {
    const body = await readBody(request); const selected = String(body.command ?? '');
    if (!commands.has(selected)) return json(response, 400, { error: '命令不在白名单内' });
    const pnpmCli = process.env.npm_execpath;
    if (!pnpmCli) return json(response, 500, { error: '请通过 pnpm studio 启动维护台' });
    const result = await run(process.execPath, [pnpmCli, commandScripts[selected]]); return json(response, result.code === 0 ? 200 : 422, result);
  }
  if (request.method === 'POST' && url.pathname === '/api/notes/sync') {
    const body = await readBody(request); const source = String(body.source ?? '');
    if (!source) return json(response, 400, { error: '必须提供本机笔记目录' });
    const result = await run(process.execPath, ['tools/blog-studio/sync-notes.mjs', '--source', source, ...(body.dryRun ? ['--dry-run'] : [])]);
    return json(response, result.code === 0 ? 200 : 422, result);
  }
  return json(response, 404, { error: 'API 不存在' });
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
    if (url.pathname.startsWith('/api/')) return await api(request, response, url);
    const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    if (!['index.html', 'studio.css', 'studio.js'].includes(file)) { response.writeHead(404); return response.end('Not found'); }
    const source = await readFile(resolve(studioRoot, file));
    response.writeHead(200, { 'Content-Type': contentTypes[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' }); response.end(source);
  } catch (error) { json(response, 500, { error: error.message }); }
});

server.listen(port, '127.0.0.1', () => {
  console.log('Blog Studio 只绑定本机，不提供远程管理面。');
  console.log(`http://127.0.0.1:${port}/?token=${token}`);
});
