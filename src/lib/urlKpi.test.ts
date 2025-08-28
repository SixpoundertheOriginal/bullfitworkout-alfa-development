import { describe, it, expect } from 'vitest';
import { parseKpiParams, writeKpiParams, withDefaults } from './urlKpi';

describe('urlKpi', () => {
  it('parses tab and kpi from search', () => {
    expect(parseKpiParams('?tab=analytics&kpi=tonnage')).toEqual({ tab: 'analytics', kpi: 'tonnage' });
  });

  it('handles missing params', () => {
    expect(parseKpiParams('?foo=bar')).toEqual({ tab: undefined, kpi: undefined });
  });

  it('writes kpi while preserving others', () => {
    const out = writeKpiParams('/overview?tab=analytics&foo=bar', { kpi: 'density' });
    expect(out).toBe('/overview?tab=analytics&foo=bar&kpi=density');
  });

  it('removes param when undefined provided', () => {
    const out = writeKpiParams('/overview?tab=analytics&kpi=tonnage', { kpi: undefined });
    expect(out).toBe('/overview?tab=analytics');
  });

  it('applies default kpi for unknown value', () => {
    const s = withDefaults({ tab: 'analytics', kpi: 'unknown' as any });
    expect(s.kpi).toBe('restTimeAvg');
  });
});

