import { describe, it, expect } from 'vitest';
import { coreKpiSpecs } from '../kpiSpecs';

describe('kpiSpecs formatters', () => {
  it('returns N/A for undefined values', () => {
    const intSpec = coreKpiSpecs.find(s => s.key === 'sets')!;
    const fixed0Spec = coreKpiSpecs.find(s => s.key === 'duration_min')!;
    const fixed2Spec = coreKpiSpecs.find(s => s.key === 'density_kg_per_min')!;

    expect(intSpec.formatter(undefined)).toBe('N/A');
    expect(fixed0Spec.formatter(undefined)).toBe('N/A');
    expect(fixed2Spec.formatter(undefined)).toBe('N/A');
  });

  it('formats zero values with precision', () => {
    const fixed0Spec = coreKpiSpecs.find(s => s.key === 'duration_min')!;
    const fixed2Spec = coreKpiSpecs.find(s => s.key === 'density_kg_per_min')!;

    expect(fixed0Spec.formatter(0)).toBe('0');
    expect(fixed2Spec.formatter(0)).toBe('0.00');
  });
});
