import { describe, expect, it } from 'vitest';
import { formatSiteDate, siteDateKey, siteDateParts } from '../lib/date';

describe('site calendar dates', () => {
  it('uses the configured publishing timezone at UTC day boundaries', () => {
    const instant = new Date('2026-08-27T16:30:00.000Z');
    expect(siteDateParts(instant)).toEqual({ year: 2026, month: 8, day: 28 });
    expect(siteDateKey(instant)).toBe('2026-08-28');
    expect(formatSiteDate(instant)).toContain('2026');
    expect(formatSiteDate(instant)).toContain('08');
    expect(formatSiteDate(instant)).toContain('28');
  });
});
