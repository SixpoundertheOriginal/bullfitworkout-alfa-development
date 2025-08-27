import { describe, it, expect } from 'vitest';
import { toChartSeries } from '../chartAdapter';

describe('ChartAdapter', () => {
  it('aligns labels and datasets', () => {
    const out = toChartSeries([{ date: '2025-08-01', value: 0 }]);
    expect(out.labels.length).toBe(out.datasets.length);
  });
});
