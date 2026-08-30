import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createContentPathPolicy } from './path-policy.mjs';

const temporaryRoots = [];
afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'someone-site-path-policy-'));
  temporaryRoots.push(root);
  await mkdir(resolve(root, 'src/content/posts/example'), { recursive: true });
  await writeFile(resolve(root, 'src/content/posts/example/index.md'), '# example', 'utf8');
  await writeFile(resolve(root, 'outside.md'), '# outside', 'utf8');
  return { root, policy: await createContentPathPolicy(root, ['src/content/posts']) };
}

describe('Blog Studio content path policy', () => {
  it('accepts real content files and rejects lexical traversal', async () => {
    const { root, policy } = await fixture();
    await expect(policy.existing('src/content/posts/example/index.md')).resolves.toBe(resolve(root, 'src/content/posts/example/index.md'));
    await expect(policy.existing('src/content/posts/../../../outside.md')).resolves.toBeNull();
    await expect(policy.newFile('src/content/posts/new-entry/index.md')).resolves.toBe(resolve(root, 'src/content/posts/new-entry/index.md'));
  });

  it('rejects a content symlink that resolves outside the allowed root', async () => {
    const { root, policy } = await fixture();
    const link = resolve(root, 'src/content/posts/example/linked.md');
    try { await symlink(resolve(root, 'outside.md'), link, 'file'); }
    catch (error) {
      if (error.code === 'EPERM' || error.code === 'EACCES') return;
      throw error;
    }
    await expect(policy.existing('src/content/posts/example/linked.md')).resolves.toBeNull();
  });
});
