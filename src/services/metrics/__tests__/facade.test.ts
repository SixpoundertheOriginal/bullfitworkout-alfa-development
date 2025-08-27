import { describe, it, expect, vi } from 'vitest';
import { getMetricsShadow } from '../getMetricsFacade';
import { InMemoryRepoStub } from '../../metrics-v2';
import * as Telemetry from '../telemetry';

const mkV1 = (over: any = {}) => ({
  totals: { totalVolumeKg: 10, ...over.totals },
  prs: Array.isArray(over.prs) ? over.prs : [1],
  series: { volume: [1,2,3], ...over.series },
});

describe('getMetricsShadow', () => {
  const fetchV1 = async () => mkV1();
  const range = { from: new Date('2025-08-01'), to: new Date('2025-08-31') };

  it('returns v1 by default (no flags)', async () => {
    const out = await getMetricsShadow('u1', range, { fetchV1, repoV2: InMemoryRepoStub });
    // We can only assert shape hints, since v1 is unknown typed
    expect((out as any).totals.totalVolumeKg).toBe(10);
  });

  it('shadow: calls v2 and emits telemetry on mismatch, but returns v1', async () => {
    const spy = vi.spyOn(Telemetry, 'emitMetricsTelemetry').mockImplementation(() => {});
    const out = await getMetricsShadow('u1', range, {
      fetchV1: async () => mkV1({ totals: { totalVolumeKg: 123 } }),
      repoV2: InMemoryRepoStub,
      flags: { shadow: true },
      userIdHashFn: () => 'user_hash',
    });
    expect((out as any).totals.totalVolumeKg).toBe(123);
    expect(spy).toHaveBeenCalled(); // mismatch vs empty v2 stub
    spy.mockRestore();
  });

  it('v2: returns ServiceOutput when v2 flag is on', async () => {
    const out = await getMetricsShadow('u1', range, {
      fetchV1,
      repoV2: InMemoryRepoStub,
      flags: { v2: true },
    });
    // v2 stub returns canonical ServiceOutput with zeroed fields
    expect((out as any).meta?.version).toBe('v2');
  });
});

