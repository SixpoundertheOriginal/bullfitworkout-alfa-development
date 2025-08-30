import React from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { DEFS_VERSION } from '@/services/metrics-v2/registry';

vi.mock('@/services/metrics-v2/service', () => ({
  metricsServiceV2: {
    getMetricsV2: vi.fn().mockResolvedValue({ series: { volume: [] } }),
  },
}));

import useMetricsV2 from '../useMetricsV2';

const client = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

describe('useMetricsV2', () => {
  it('uses stable query key', () => {
    (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = true;
    const params = { startISO: '2024-01-01', endISO: '2024-01-07', includeBodyweightLoads: undefined };
    renderHook(() => useMetricsV2('u1', params), { wrapper });
    const queries = client.getQueryCache().getAll();
    expect(queries[0].queryKey).toEqual([
      'metricsV2',
      params.startISO,
      params.endISO,
      true,
      DEFS_VERSION,
    ]);
  });
});
