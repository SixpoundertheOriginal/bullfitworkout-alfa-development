import { describe, it, expect, vi } from 'vitest';
import { normalizeTotals } from '../chartAdapter';

describe('normalizeTotals density fallback', () => {
  it('computes density when missing and logs under diagnostics flag', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const out = normalizeTotals({ tonnage_kg: 100, duration_min: 20 });
    expect(out.density_kg_per_min).toBe(5);
    expect(spy).toHaveBeenCalledWith('[adapter] density fallback applied:', {
      tonnage_kg: 100,
      duration_min: 20,
      density: 5,
    });
    spy.mockRestore();
  });

  it('computes density when provided as 0', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const out = normalizeTotals({
      tonnage_kg: 50,
      duration_min: 10,
      density_kg_per_min: 0,
    });
    expect(out.density_kg_per_min).toBe(5);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
