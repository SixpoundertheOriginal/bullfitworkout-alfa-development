import { describe, it, expect } from 'vitest';
import { summarizeParityDiff } from '../parity';

describe('summarizeParityDiff', () => {
  it('returns null when key fields match', () => {
    const v1 = { totals: { totalVolumeKg: 100 }, prs: [1,2], series: { volume: [1,2,3] } };
    const v2 = { totals: { totalVolumeKg: 100 }, prs: [1,2], series: { volume: [1,2,3] } };
    expect(summarizeParityDiff(v1, v2)).toBeNull();
  });

  it('reports mismatches when key fields differ', () => {
    const v1 = { totals: { totalVolumeKg: 100 }, prs: [1], series: { volume: [1,2,3] } };
    const v2 = { totals: { totalVolumeKg: 120 }, prs: [], series: { volume: [1,2] } };
    const diff = summarizeParityDiff(v1, v2)!;
    expect(diff.mismatches).toContain('totals.totalVolumeKg');
    expect(diff.mismatches).toContain('prs.length');
    expect(diff.mismatches).toContain('series.volume.len');
  });
});

