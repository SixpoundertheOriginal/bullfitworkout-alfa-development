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

  it('maps legacy density key to density_kg_per_min', () => {
    const payload = { series: { density: [{ timestamp: '2024-05-01T06:00:00Z', value: 7 }] } };
    const out = toChartSeries(payload);
    expect(out.series.density_kg_per_min).toEqual([
      { date: '2024-05-01', value: 7 },
    ]);
  });

  it('maps rest and efficiency metrics with Warsaw date conversion', () => {
    const out = toChartSeries(v2Payload);
    expect(out.series.avg_rest_sec).toEqual([
      { date: '2024-05-02', value: 90 },
    ]);
    expect(out.series.set_efficiency_kg_per_min).toEqual([
      { date: '2024-05-01', value: 1.5 },
    ]);
  });
});
