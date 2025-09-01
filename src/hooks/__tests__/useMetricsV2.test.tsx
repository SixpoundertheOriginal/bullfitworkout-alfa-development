import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { DEFS_VERSION } from '@/services/metrics-v2/registry';
import { TONNAGE_ID } from '@/pages/analytics/metricIds';

vi.mock('@/services/metrics-v2/service', () => ({
  metricsServiceV2: {
    getMetricsV2: vi.fn().mockResolvedValue({ series: { tonnageKg: [] } }),
  },
}));

import useMetricsV2, { useMetricsV2Analytics } from '../useMetricsV2';
import { metricsServiceV2 } from '@/services/metrics-v2/service';

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
      false,
      75,
      DEFS_VERSION,
    ]);
    client.clear();
  });

  // Series key mapping covered in adapter tests
});

describe('useMetricsV2Analytics', () => {
  it('maps snake_case series keys to camelCase outputs', async () => {
    vi.mocked(metricsServiceV2.getMetricsV2).mockResolvedValue({
      series: {
        sets_count: [{ date: '2024-01-01', value: 2 }],
        reps_total: [{ date: '2024-01-01', value: 10 }],
      },
    } as any);
    const client = new QueryClient();
    const localWrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, unmount } = renderHook(
      () =>
        useMetricsV2Analytics('u1', {
          startISO: '2024-01-01',
          endISO: '2024-01-07',
        }),
      { wrapper: localWrapper }
    );
    const res = await result.current.refetch();
    expect(res.data?.series?.sets?.[0]).toEqual({
      timestamp: '2024-01-01T00:00:00.000Z',
      value: 2,
    });
    expect(res.data?.series?.reps?.[0]).toEqual({
      timestamp: '2024-01-01T00:00:00.000Z',
      value: 10,
    });
    client.clear();
    unmount();
  });
});
