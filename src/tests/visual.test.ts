import { describe, expect, it } from 'vitest';
import { accentStyle, normalizeAccent } from '../lib/visual';

describe('content accent fallbacks', () => {
  it('keeps missing or unknown content accents renderable', () => {
    expect(normalizeAccent(undefined)).toBe('aqua');
    expect(normalizeAccent('unknown')).toBe('aqua');
    expect(() => accentStyle(undefined)).not.toThrow();
    expect(accentStyle('unknown')).toContain('--spectrum-aqua-rgb');
  });

  it('preserves valid semantic accents', () => {
    expect(normalizeAccent('coral')).toBe('coral');
    expect(accentStyle('coral')).toContain('--spectrum-coral-rgb');
  });
});
