import { describe, it, expect } from 'vitest';
import { buildMetricOptions } from '../metricOptions';

const keys = ['volume','sets','workouts','duration','reps','density','avgRest','setEfficiency'];

describe('buildMetricOptions', () => {
  it('filters derived metrics when flag disabled', () => {
    const opts = buildMetricOptions(keys, false);
    expect(opts).toHaveLength(5);
    expect(opts.find(o => o.key === 'density')).toBeUndefined();
  });

  it('includes derived metrics when flag enabled', () => {
    const opts = buildMetricOptions(keys, true);
    expect(opts).toHaveLength(8);
    expect(opts.find(o => o.key === 'density')).toBeDefined();
  });
});
