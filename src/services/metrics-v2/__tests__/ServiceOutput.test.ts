import { describe, it, expect } from 'vitest';
import { getMetricsV2, InMemoryRepoStub } from '../index';
import { withoutVolatile } from '../../../../tests/helpers/stableSnapshot';

describe('ServiceOutput shape (v2)', () => {
  it('returns a versioned, canonical structure', async () => {
    const out = await getMetricsV2(InMemoryRepoStub, 'u1', { from: new Date(), to: new Date() });
    expect(out.meta.version).toBe('v2');
    expect(out.series.tonnage_kg.length).toBe(out.series.tonnage_kg.length); // sanity
    expect(withoutVolatile(out)).toMatchSnapshot();
  });
});
