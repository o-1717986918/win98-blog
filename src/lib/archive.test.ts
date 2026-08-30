import { describe, expect, it } from 'vitest';
import type { PostEntry } from './content';
import { archiveDateParts, groupPostsByYearMonth } from './archive';

const post = (id: string, date: string) => ({ id, data: { date: new Date(date) } }) as unknown as PostEntry;

describe('archive grouping', () => {
  it('groups years and months newest first while preserving post chronology', () => {
    const groups = groupPostsByYearMonth([
      post('older-year', '2025-12-20T09:00:00+08:00'),
      post('august-early', '2026-08-02T09:00:00+08:00'),
      post('july', '2026-07-31T09:00:00+08:00'),
      post('august-late', '2026-08-29T09:00:00+08:00'),
    ]);

    expect(groups.map((group) => group.year)).toEqual([2026, 2025]);
    expect(groups[0]?.months.map((month) => month.month)).toEqual([8, 7]);
    expect(groups[0]?.months[0]?.posts.map((entry) => entry.id)).toEqual(['august-late', 'august-early']);
    expect(groups[0]?.count).toBe(3);
  });

  it('uses the publishing timezone at a UTC date boundary', () => {
    expect(archiveDateParts(new Date('2026-08-29T00:00:00+08:00'))).toEqual({ year: 2026, month: 8, day: 29 });
  });
});

