import type { PostEntry } from './content';
import { siteDateParts } from './date';

export interface ArchiveMonthGroup {
  year: number;
  month: number;
  posts: PostEntry[];
}

export interface ArchiveYearGroup {
  year: number;
  count: number;
  months: ArchiveMonthGroup[];
}

export const archiveDateParts = siteDateParts;

export const groupPostsByYearMonth = (posts: PostEntry[]): ArchiveYearGroup[] => {
  const years = new Map<number, Map<number, PostEntry[]>>();
  for (const post of posts) {
    const { year, month } = archiveDateParts(post.data.date);
    const months = years.get(year) ?? new Map<number, PostEntry[]>();
    const entries = months.get(month) ?? [];
    entries.push(post);
    months.set(month, entries);
    years.set(year, months);
  }

  return [...years.entries()]
    .sort(([left], [right]) => right - left)
    .map(([year, months]) => {
      const groupedMonths = [...months.entries()]
        .sort(([left], [right]) => right - left)
        .map(([month, entries]) => ({
          year,
          month,
          posts: [...entries].sort((left, right) => right.data.date.getTime() - left.data.date.getTime() || left.id.localeCompare(right.id, 'en')),
        }));
      return {
        year,
        count: groupedMonths.reduce((total, month) => total + month.posts.length, 0),
        months: groupedMonths,
      };
    });
};
