import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfigProvider } from '@/config/runtimeConfig';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { AnalyticsPage } from '../AnalyticsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// counts renders based on console.debug log emitted by AnalyticsPage

describe('AnalyticsPage render with derived KPI feature flag', () => {
  it('renders a finite number of times when ANALYTICS_DERIVED_KPIS_ENABLED toggles', () => {
    const original = FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED;
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let renderCalls = 0;
    let errorCalls = 0;
    try {
      // initial render with flag enabled
      (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = true;
      const client = new QueryClient();
      const { rerender } = render(
        <QueryClientProvider client={client}>
          <ConfigProvider initialFlags={{ derivedKpis: FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED }}>
            <AnalyticsPage data={{ metricKeys: [] }} />
          </ConfigProvider>
        </QueryClientProvider>
      );

      // toggle flag and rerender
      (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = false;
      rerender(
        <QueryClientProvider client={client}>
          <ConfigProvider initialFlags={{ derivedKpis: FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED }}>
            <AnalyticsPage data={{ metricKeys: [] }} />
          </ConfigProvider>
        </QueryClientProvider>
      );

      renderCalls = debugSpy.mock.calls.filter((args) =>
        typeof args[0] === 'string' && args[0].includes('[AnalyticsPage] render')
      ).length;
      errorCalls = errorSpy.mock.calls.length;
    } finally {
      (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = original;
      debugSpy.mockRestore();
      errorSpy.mockRestore();
    }

    expect(renderCalls).toBe(2);
    expect(errorCalls).toBe(0);
  });
});

