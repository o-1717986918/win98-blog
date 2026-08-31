import { describe, expect, it } from 'vitest';
import { parseFrontmatter, readRouteMetadata } from '../lib/frontmatter.mjs';

describe('frontmatter parsing', () => {
  it('supports quoted values, comments and block arrays', () => {
    const source = `---
title: "带引号的标题"
chrome: "none" # 合法 YAML 注释
draft: true
columns:
  - engineering
  - notes
date: 2026-09-01T09:00:00+08:00
---
正文`;
    expect(parseFrontmatter(source, 'sample.mdx')).toMatchObject({
      title: '带引号的标题',
      chrome: 'none',
      draft: true,
      columns: ['engineering', 'notes'],
    });
    expect(readRouteMetadata(source, 'sample.mdx', 'posts')).toEqual({
      chrome: 'none',
      draft: true,
      publishAt: Date.parse('2026-09-01T09:00:00+08:00'),
    });
  });

  it('keeps the full chrome default', () => {
    expect(readRouteMetadata('---\ntitle: 默认\ndate: 2026-08-29\n---\n', 'sample.mdx', 'posts')).toEqual({
      chrome: 'full',
      draft: false,
      publishAt: new Date('2026-08-29').getTime(),
    });
  });

  it('rejects invalid route metadata', () => {
    expect(() => readRouteMetadata('---\nchrome: floating\ndate: 2026-08-29\n---\n', 'sample.mdx', 'posts')).toThrow('Invalid route metadata');
    expect(() => readRouteMetadata('---\ndraft: maybe\ndate: 2026-08-29\n---\n', 'sample.mdx', 'posts')).toThrow('Invalid route metadata');
    expect(() => readRouteMetadata('---\ndate: not-a-date\n---\n', 'sample.mdx', 'posts')).toThrow('Invalid route metadata');
  });

  it('uses the same date coercion as the content schema', () => {
    expect(readRouteMetadata('---\ndate: 1893456000000\n---\n', 'sample.mdx', 'posts').publishAt)
      .toBe(new Date(1_893_456_000_000).getTime());
    expect(readRouteMetadata('---\ndate: 2099-01-01\n---\n', 'sample.mdx', 'columns').publishAt).toBeUndefined();
  });
});
