import { access, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const [kind, slug, ...titleParts] = process.argv.slice(2);
const title = titleParts.join(' ').trim();

const fail = (message) => {
  console.error(`Content scaffold failed: ${message}`);
  process.exit(1);
};

if (!['post', 'column'].includes(kind)) fail('类型必须是 post 或 column');
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail('slug 只能包含小写字母、数字和单连字符');
if (!title) fail('请在 slug 后提供标题');

const collection = kind === 'post' ? 'posts' : 'columns';
const directory = resolve(root, 'src', 'content', collection, slug);
try {
  await access(directory);
  fail(`${collection}/${slug} 已存在`);
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const today = new Date().toISOString().slice(0, 10);
const yamlTitle = JSON.stringify(title);
const frontmatter = kind === 'post'
  ? `---\ntitle: ${yamlTitle}\ndescription: 请补充一段准确摘要。\ndate: ${today}\ntags: []\ncolumns: []\nchrome: full\ntheme: abyss\ndraft: true\n---\n\n从这里开始写作。\n`
  : `---\ntitle: ${yamlTitle}\ndescription: 请说明这个主题收录什么。\nchrome: full\ntheme: abyss\naccent: aqua\nnav: false\norder: 100\nshowPosts: true\ndraft: true\n---\n\n从这里开始编写主题说明。\n`;

await mkdir(directory, { recursive: false });
await writeFile(resolve(directory, 'index.mdx'), frontmatter, { encoding: 'utf8', flag: 'wx' });
console.log(`Created ${collection}/${slug}/index.mdx (draft=true).`);
