import { describe, expect, it, vi } from 'vitest';
import { resolve } from 'node:path';
import { contentRouteWatcher, isContentEntry } from '../integrations/content-routes.mjs';

describe('content route discovery', () => {
  it('recognizes only collection index entries', () => {
    const root = resolve('src/content/posts');
    expect(isContentEntry(resolve(root, 'new-entry/index.mdx'), [root])).toBe(true);
    expect(isContentEntry(resolve(root, 'new-entry/cover.png'), [root])).toBe(false);
    expect(isContentEntry(resolve('outside/index.mdx'), [root])).toBe(false);
  });

  it('restarts the dev server when a new entry is added', async () => {
    const listeners = new Map<string, (path: string) => Promise<void>>();
    const restart = vi.fn().mockResolvedValue(undefined);
    const server = {
      restart,
      watcher: { on: (event: string, listener: (path: string) => Promise<void>) => listeners.set(event, listener) },
    };
    const root = resolve('src/content/posts');
    contentRouteWatcher([root]).configureServer(server);
    await listeners.get('add')?.(resolve(root, 'new-entry/index.mdx'));
    expect(restart).toHaveBeenCalledOnce();
  });
});
