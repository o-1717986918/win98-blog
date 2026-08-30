import { describe, expect, it } from 'vitest';
import { isPublishedForPreview } from '../lib/content';

const entry = (draft: boolean, date?: Date): { data: { draft: boolean; date?: Date } } => ({
  data: date ? { draft, date } : { draft },
});

describe('content visibility', () => {
  it('keeps drafts private in production and renderable in explicit previews', () => {
    expect(isPublishedForPreview(entry(true), false)).toBe(false);
    expect(isPublishedForPreview(entry(true), true)).toBe(true);
  });

  it('keeps future entries private unless previewing unpublished content', () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(isPublishedForPreview(entry(false, future), false)).toBe(false);
    expect(isPublishedForPreview(entry(false, future), true)).toBe(true);
  });
});
