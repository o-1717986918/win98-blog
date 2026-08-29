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
    expect(readRouteMetadata(source, 'sample.mdx')).toEqual({
      chrome: 'none',
      draft: true,
      publishAt: Date.parse('2026-09-01T09:00:00+08:00'),
    });
  });

  it('keeps the full chrome default', () => {
    expect(readRouteMetadata('---\ntitle: 默认\n---\n', 'sample.mdx')).toEqual({
      chrome: 'full',
      draft: false,
      publishAt: undefined,
    });
  });

  it('rejects invalid route metadata', () => {
    expect(() => readRouteMetadata('---\nchrome: floating\n---\n', 'sample.mdx')).toThrow('Unsupported chrome');
    expect(() => readRouteMetadata('---\ndraft: maybe\n---\n', 'sample.mdx')).toThrow('draft must be boolean');
    expect(() => readRouteMetadata('---\ndate: not-a-date\n---\n', 'sample.mdx')).toThrow('Invalid date');
  });
});
