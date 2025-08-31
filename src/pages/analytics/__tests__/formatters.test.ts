import { describe, it, expect } from 'vitest';
import { toFinite, formatSeconds, formatKgPerMin } from '../formatters';

describe('analytics formatters', () => {
  it('toFinite returns 0 for non-finite values', () => {
    expect(toFinite(5)).toBe(5);
    expect(toFinite(null)).toBe(0);
    expect(toFinite(undefined)).toBe(0);
    expect(toFinite(NaN)).toBe(0);
    expect(toFinite(Infinity)).toBe(0);
  });

  it('formatSeconds formats seconds with units', () => {
    expect(formatSeconds(125)).toBe('2m 5s');
    expect(formatSeconds(null)).toBe('0m 0s');
  });

  it('formatKgPerMin formats numbers with units', () => {
    expect(formatKgPerMin(12.345)).toBe('12.35 kg/min');
    expect(formatKgPerMin(undefined)).toBe('0 kg/min');
  });
});
