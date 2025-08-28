import { describe, it, expect } from 'vitest';
import { parseKpiTabParams, writeKpiTabParams } from './url';

describe('url utils', () => {
  it('parses tab and kpi params', () => {
    const qs = '?tab=analytics&kpi=tonnage&from=2025-01-01';
    const parsed = parseKpiTabParams(qs);
    expect(parsed.tab).toBe('analytics');
    expect(parsed.kpi).toBe('tonnage');
  });

  it('writes params preserving others', () => {
    const qs = '?from=2025-01-01&client=123';
    const out = writeKpiTabParams(qs, { tab: 'analytics', kpi: 'duration' });
    expect(out).toContain('from=2025-01-01');
    expect(out).toContain('client=123');
    expect(out).toContain('tab=analytics');
    expect(out).toContain('kpi=duration');
  });

  it('removes params when undefined', () => {
    const qs = '?tab=analytics&kpi=tonnage&from=2025-01-01';
    const out = writeKpiTabParams(qs, { tab: undefined, kpi: 'duration' });
    expect(out).not.toContain('tab=analytics');
    expect(out).toContain('kpi=duration');
  });

  it('returns empty string when no params left', () => {
    const qs = '?tab=analytics';
    const out = writeKpiTabParams(qs, { tab: undefined, kpi: undefined });
    expect(out).toBe('');
  });
});
