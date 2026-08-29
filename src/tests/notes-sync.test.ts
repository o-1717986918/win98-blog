import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const execute = promisify(execFile);
const temporaryDirectories: string[] = [];

afterEach(async () => {
  const { rm } = await import('node:fs/promises');
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe('local notes sync', () => {
  it('copies attachments, preserves private notes and never exposes a private wiki route', async () => {
    const workspace = await mkdtemp(resolve(tmpdir(), 'someone-site-notes-'));
    temporaryDirectories.push(workspace);
    const source = resolve(workspace, 'vault');
    const output = resolve(workspace, 'published');
    await mkdir(resolve(source, 'assets'), { recursive: true });
    await writeFile(resolve(source, 'assets', 'diagram.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h10v10z"/></svg>', 'utf8');
    await writeFile(resolve(source, 'Public note.md'), `---
title: Public note
description: A fixture with an attachment and two wiki links.
created: 2026-08-29
tags: [test, public]
publish: true
---

[[Second public]] / [[Private draft]]

![[assets/diagram.svg]]
`, 'utf8');
    await writeFile(resolve(source, 'Second public.md'), `---
title: Second public
created: 2026-08-29
publish: true
---
`, 'utf8');
    await writeFile(resolve(source, 'Private draft.md'), `---
title: Private draft
created: 2026-08-29
publish: false
---
`, 'utf8');

    await execute(process.execPath, [
      resolve(process.cwd(), 'tools/blog-studio/sync-notes.mjs'),
      '--source', source,
      '--output', output,
    ]);

    const publicNote = await readFile(resolve(output, 'public-note', 'index.md'), 'utf8');
    const manifest = JSON.parse(await readFile(resolve(output, '.sync-manifest.json'), 'utf8')) as {
      entries: Array<{ source: string; slug: string; publish: boolean; attachments: number }>;
    };
    expect(publicNote).toContain('[Second public](/notes/second-public/)');
    expect(publicNote).not.toContain('/notes/private-draft/');
    expect(publicNote).toContain('Private draft');
    expect(publicNote).toMatch(/\.\/assets\/diagram-[a-f0-9]{8}\.svg/u);
    expect(manifest.entries).toHaveLength(3);
    expect(manifest.entries.filter((entry) => entry.publish)).toHaveLength(2);
    expect(manifest.entries.find((entry) => entry.slug === 'public-note')?.attachments).toBe(1);
    expect(JSON.stringify(manifest)).not.toContain(workspace);
  });
});
