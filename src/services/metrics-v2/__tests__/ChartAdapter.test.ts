import { describe, it, expect } from 'vitest';
import { toChartSeries } from '../chartAdapter';
import { v2Payload, expectedChartSeries } from './metrics-v2.fixture';

describe('chartAdapter', () => {
  it('maps v2 payload to snake_case keys and {date,value}', () => {
    const out = toChartSeries(v2Payload);
    expect(out).toEqual(expectedChartSeries);
  });

  it('maps densityKgPerMin to density_kg_per_min', () => {
    const out = toChartSeries(v2Payload);
    expect(out.series.density_kg_per_min).toEqual([
      { date: '2024-05-01', value: 5 },
    ]);
  });
});
