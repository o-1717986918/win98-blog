import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const requestedRoot = process.argv[2] ?? 'prototype';
const root = resolve(workspaceRoot, requestedRoot);
const port = Number.parseInt(process.argv[3] ?? process.env.PORT ?? '8765', 10);
const basePath = process.env.BASE_PATH ? `/${process.env.BASE_PATH.replace(/^\/+|\/+$/g, '')}` : '';

if (root !== workspaceRoot && !root.startsWith(`${workspaceRoot}${sep}`)) {
  throw new Error(`Site directory must stay inside the workspace: ${requestedRoot}`);
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: ${process.env.PORT}`);
}

const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);
    let pathname = decodeURIComponent(url.pathname);
    if (basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))) {
      pathname = pathname.slice(basePath.length) || '/';
    }
    const relativePath = pathname.replace(/^\/+/, '') || 'index.html';
    let filePath = resolve(root, relativePath);
    if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    let info = await stat(filePath);
    if (info.isDirectory()) {
      filePath = resolve(filePath, 'index.html');
      info = await stat(filePath);
    }
    if (!info.isFile()) throw new Error('Not a file');
    const contents = await readFile(filePath);
    response.writeHead(200, {
      'cache-control': 'no-store',
      'content-type': mime[extname(filePath)] ?? 'application/octet-stream',
    });
    response.end(contents);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  const baseUrl = `http://127.0.0.1:${port}${basePath || ''}/`;
  console.log(`Serving ${requestedRoot} at ${baseUrl}`);
});
