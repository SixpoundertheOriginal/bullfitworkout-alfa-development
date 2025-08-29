import { describe, it, expect } from 'vitest';
import { availableMetrics } from '../registry';

describe('metrics registry', () => {
  it('returns base metrics when flag is false', () => {
    const opts = availableMetrics({ derivedKpis: false });
    expect(opts).toHaveLength(5);
    expect(opts.find(o => o.key === 'density')).toBeUndefined();
  });

  it('returns base plus derived metrics when flag is true', () => {
    const opts = availableMetrics({ derivedKpis: true });
    expect(opts).toHaveLength(8);
    expect(opts.find(o => o.key === 'density')).toBeDefined();
  });
});
