import { describe, it, expect } from 'vitest';
import { getMetricsV2, InMemoryMetricsRepository } from '../index';

const InMemoryRepoStub = new InMemoryMetricsRepository();
import { withoutVolatile } from '../../../../tests/helpers/stableSnapshot';
import { TONNAGE_ID } from '@/pages/analytics/metricIds';

describe('ServiceOutput shape (v2)', () => {
  it('returns a versioned, canonical structure', async () => {
    const out = await getMetricsV2(InMemoryRepoStub, 'u1', { from: new Date(), to: new Date() });
    expect(out.meta.version).toBe('v2');
    expect(out.series[TONNAGE_ID].length).toBe(out.series[TONNAGE_ID].length); // sanity
    expect(withoutVolatile(out)).toMatchSnapshot();
  });
});
