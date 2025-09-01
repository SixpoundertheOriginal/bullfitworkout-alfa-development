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

  it('maps legacy density_kg_min to density_kg_per_min', () => {
    const payload = { series: { density_kg_min: [{ timestamp: '2024-05-01T06:00:00Z', value: 9 }] } };
    const out = toChartSeries(payload);
    expect(out.series.density_kg_per_min).toEqual([
      { date: '2024-05-01', value: 9 },
    ]);
  });

  it('recomputes density when missing and exposes camel+snake keys', () => {
    const payload = {
      series: {
        tonnage_kg: [
          { timestamp: '2024-05-01T06:00:00Z', value: 2000 },
          { timestamp: '2024-05-02T06:00:00Z', value: 100 },
        ],
        duration_min: [
          { timestamp: '2024-05-01T06:00:00Z', value: 40 },
          { timestamp: '2024-05-02T06:00:00Z', value: 0 },
        ],
      },
    };
    const out = toChartSeries(payload);
    expect(out.series.density_kg_per_min).toEqual([
      { date: '2024-05-01', value: 50 },
      { date: '2024-05-02', value: null },
    ]);
    expect(out.series.densityKgPerMin).toBe(out.series.density_kg_per_min);
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

  it('exposes rest and efficiency metrics with camel+snake keys', () => {
    const out = toChartSeries(v2Payload);
    expect(out.series).toHaveProperty('avg_rest_sec');
    expect(out.series).toHaveProperty('avgRestSec');
    expect(out.series.avgRestSec).toBe(out.series.avg_rest_sec);
    expect(out.series).toHaveProperty('set_efficiency_kg_per_min');
    expect(out.series).toHaveProperty('setEfficiencyKgPerMin');
    expect(out.series.setEfficiencyKgPerMin).toBe(out.series.set_efficiency_kg_per_min);
  });

  it('preserves null values without coercion', () => {
    const payload = {
      series: {
        tonnageKg: [{ timestamp: '2024-05-03T06:00:00Z', value: null }],
      },
    };
    const out = toChartSeries(payload);
    expect(out.series.tonnage_kg).toEqual([
      { date: '2024-05-03', value: null },
    ]);
  });

  it('computes set efficiency when missing and normalizes keys', () => {
    const payload = {
      series: {
        tonnageKg: [
          { timestamp: '2024-05-01T06:00:00Z', value: 2000 },
          { timestamp: '2024-05-02T06:00:00Z', value: 100 },
        ],
        durationMin: [
          { timestamp: '2024-05-01T06:00:00Z', value: 40 },
          { timestamp: '2024-05-02T06:00:00Z', value: 0 },
        ],
      },
    };
    const out = toChartSeries(payload);
    expect(out.series.set_efficiency_kg_per_min).toEqual([
      { date: '2024-05-01', value: 50 },
      { date: '2024-05-02', value: null },
    ]);
    expect(out.series.setEfficiencyKgPerMin).toBe(out.series.set_efficiency_kg_per_min);
    const values = out.series.set_efficiency_kg_per_min.map(p => p.value);
    expect(values.some(v => Number.isNaN(v as number) || v === Infinity || v === -Infinity)).toBe(false);
  });

  it('skips rest and efficiency when includeDerived is false', () => {
    const payload = {
      series: {
        tonnage_kg: [{ timestamp: '2024-05-01T06:00:00Z', value: 200 }],
        duration_min: [{ timestamp: '2024-05-01T06:00:00Z', value: 20 }],
        avg_rest_sec: [{ timestamp: '2024-05-01T06:00:00Z', value: 30 }],
      },
    };
    const out = toChartSeries(payload, false);
    expect(out.series).not.toHaveProperty('avg_rest_sec');
    expect(out.series).not.toHaveProperty('set_efficiency_kg_per_min');
    expect(out.availableMeasures).not.toContain('avg_rest_sec');
    expect(out.availableMeasures).not.toContain('set_efficiency_kg_per_min');
  });

  it('includes sets and reps series and measures', () => {
    const out = toChartSeries(v2Payload);
    expect(out.series.sets).toEqual(expectedChartSeries.series.sets);
    expect(out.series.reps).toEqual(expectedChartSeries.series.reps);
    expect(out.availableMeasures).toContain('sets');
    expect(out.availableMeasures).toContain('reps');
  });
});
