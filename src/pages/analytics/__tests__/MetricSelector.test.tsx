import { vi, describe, it, expect, afterEach } from 'vitest';

describe('metric options', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('includes base and derived metrics when flag enabled', async () => {
    vi.doMock('@/constants/featureFlags', () => ({ ANALYTICS_DERIVED_KPIS_ENABLED: true }));
    const { getMetricOptions } = await import('../metrics');
    const opts = getMetricOptions();
    expect(opts).toHaveLength(8);
    expect(opts.some(o => o.key === 'setEfficiency')).toBe(true);
    expect(opts.some(o => o.key === 'setEfficiency')).toBe(true);
  });

  it('only includes base metrics when flag disabled', async () => {
    vi.doMock('@/constants/featureFlags', () => ({ ANALYTICS_DERIVED_KPIS_ENABLED: false }));
    const { getMetricOptions } = await import('../metrics');
    const opts = getMetricOptions();
    expect(opts).toHaveLength(5);
  });
});
