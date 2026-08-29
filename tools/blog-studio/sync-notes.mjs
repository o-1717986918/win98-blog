import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const projectRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const defaultOutputRoot = resolve(projectRoot, 'src', 'content', 'notes');

function argumentsFrom(argv) {
  const result = { source: '', output: '', dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--source') result.source = argv[index + 1] ?? '';
    if (argv[index] === '--output') result.output = argv[index + 1] ?? '';
    if (argv[index] === '--dry-run') result.dryRun = true;
  }
  return result;
}

function frontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/u);
  if (!match) return { data: {}, body: source };
  const data = parse(match[1]) ?? {};
  if (typeof data !== 'object' || Array.isArray(data)) throw new Error('frontmatter 必须是对象');
  return { data, body: source.slice(match[0].length) };
}

function stableSlug(value, relativePath) {
  const ascii = String(value ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 64);
  return ascii || `note-${createHash('sha1').update(relativePath).digest('hex').slice(0, 10)}`;
}

function yamlDate(value, fallback) {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback.toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

function safeChild(root, candidate) {
  const target = resolve(root, candidate);
  return target === root || target.startsWith(`${root}${sep}`) ? target : null;
}

async function collectMarkdown(root) {
  const files = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/\.mdx?$/iu.test(entry.name)) files.push(path);
    }
  }
  await walk(root);
  return files.sort((a, b) => a.localeCompare(b));
}

async function locateAttachment(noteFile, sourceRoot, reference) {
  const clean = decodeURIComponent(reference.split(/[?#]/u)[0] ?? '').replace(/^<|>$/gu, '');
  if (!clean || /^(?:https?:|data:|\/)/iu.test(clean)) return null;
  const beside = safeChild(sourceRoot, resolve(dirname(noteFile), clean));
  if (beside) {
    try { if ((await stat(beside)).isFile()) return beside; } catch {}
  }
  const byRoot = safeChild(sourceRoot, clean);
  if (byRoot) {
    try { if ((await stat(byRoot)).isFile()) return byRoot; } catch {}
  }
  return null;
}

async function main() {
  const options = argumentsFrom(process.argv.slice(2));
  if (!options.source) throw new Error('用法：pnpm notes:sync -- --source "D:\\Notes" [--dry-run]');
  const sourceRoot = resolve(options.source);
  const outputRoot = options.output ? resolve(options.output) : defaultOutputRoot;
  if (!(await stat(sourceRoot)).isDirectory()) throw new Error(`笔记源不是目录：${sourceRoot}`);
  const files = await collectMarkdown(sourceRoot);
  const entries = [];
  const used = new Set();

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const parsed = frontmatter(source);
    const relativePath = relative(sourceRoot, file).replaceAll('\\', '/');
    const title = String(parsed.data.title ?? basename(file, extname(file))).trim();
    let slug = stableSlug(parsed.data.slug ?? title, relativePath);
    if (used.has(slug)) slug = `${slug}-${createHash('sha1').update(relativePath).digest('hex').slice(0, 6)}`;
    used.add(slug);
    const publish = parsed.data.publish === true || parsed.data.public === true || parsed.data.blog === true;
    entries.push({ file, relativePath, title, slug, parsed, publish, fileStat: await stat(file) });
  }

  const titleMap = new Map(entries.filter((entry) => entry.publish).flatMap((entry) => [entry.title, basename(entry.file, extname(entry.file))]
    .map((name) => [String(name).trim().toLowerCase(), entry.slug])));
  const manifest = [];

  for (const entry of entries) {
    const targetDirectory = resolve(outputRoot, entry.slug);
    const attachments = new Map();
    const copiedAttachments = new Set();
    let body = entry.parsed.body;
    body = body.replace(/!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/gu, (full, sourceName) => {
      const key = `__WIKI_ASSET_${attachments.size}__`;
      attachments.set(key, String(sourceName).trim());
      return `![${basename(String(sourceName), extname(String(sourceName)))}](${key})`;
    });
    body = body.replace(/(?<!!)\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/gu, (full, target, label) => {
      const slug = titleMap.get(String(target).trim().toLowerCase());
      return slug ? `[${String(label ?? target).trim()}](/notes/${slug}/)` : String(label ?? target).trim();
    });

    const imageMatches = [...body.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/gu)];
    for (const match of imageMatches) {
      const rawReference = match[2];
      const lookup = attachments.get(rawReference) ?? rawReference;
      const attachment = await locateAttachment(entry.file, sourceRoot, lookup);
      if (!attachment) continue;
      const digest = createHash('sha1').update(relative(sourceRoot, attachment)).digest('hex').slice(0, 8);
      const outputName = `${basename(attachment, extname(attachment)).replace(/[^a-z0-9-]+/giu, '-').replace(/^-+|-+$/gu, '') || 'asset'}-${digest}${extname(attachment).toLowerCase()}`;
      const publicReference = `./assets/${outputName}`;
      body = body.replace(`(${rawReference})`, `(${publicReference})`);
      if (!options.dryRun) {
        await mkdir(resolve(targetDirectory, 'assets'), { recursive: true });
        await copyFile(attachment, resolve(targetDirectory, 'assets', outputName));
      }
      copiedAttachments.add(outputName);
    }

    for (const [placeholder, original] of attachments) body = body.replaceAll(placeholder, original);
    const created = yamlDate(entry.parsed.data.created ?? entry.parsed.data.date, entry.fileStat.birthtime);
    const updated = yamlDate(entry.parsed.data.updated ?? entry.parsed.data.modified, entry.fileStat.mtime);
    const metadata = {
      title: entry.title,
      description: String(entry.parsed.data.description ?? entry.parsed.data.summary ?? '').trim(),
      created,
      updated,
      tags: Array.isArray(entry.parsed.data.tags) ? entry.parsed.data.tags.map(String) : [],
      aliases: Array.isArray(entry.parsed.data.aliases) ? entry.parsed.data.aliases.map(String) : [],
      publish: entry.publish,
      source: entry.relativePath,
      draft: entry.parsed.data.draft === true,
    };
    const output = `---\n${stringify(metadata).trim()}\n---\n\n${body.trim()}\n`;
    if (!options.dryRun) {
      await mkdir(targetDirectory, { recursive: true });
      await writeFile(resolve(targetDirectory, 'index.md'), output, 'utf8');
    }
    manifest.push({ source: entry.relativePath, slug: entry.slug, publish: metadata.publish, attachments: copiedAttachments.size });
  }

  if (!options.dryRun) {
    await mkdir(outputRoot, { recursive: true });
    await writeFile(resolve(outputRoot, '.sync-manifest.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), entries: manifest }, null, 2)}\n`, 'utf8');
  }
  console.log(`${options.dryRun ? 'Dry run' : 'Sync'} complete: ${manifest.length} notes, ${manifest.filter((item) => item.publish).length} public.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
