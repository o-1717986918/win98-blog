import type { PostEntry } from './content';

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

const archiveDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const archiveDateParts = (date: Date) => {
  const values = new Map(archiveDateFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(values.get('year')),
    month: Number(values.get('month')),
    day: Number(values.get('day')),
  };
};

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
          posts: [...entries].sort((left, right) => right.data.date.getTime() - left.data.date.getTime()),
        }));
      return {
        year,
        count: groupedMonths.reduce((total, month) => total + month.posts.length, 0),
        months: groupedMonths,
      };
    });
};

