import { describe, it, expect } from 'vitest';
import { toChartSeries } from '../chartAdapter';
import { v2Payload, expectedChartSeries } from './metrics-v2.fixture';

describe('chartAdapter', () => {
  it('maps v2 payload to snake_case keys and {date,value}', () => {
    const out = toChartSeries(v2Payload);
    expect(out).toEqual(expectedChartSeries);
  });
});
