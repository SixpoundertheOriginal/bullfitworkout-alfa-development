import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { AnalyticsPage } from '../AnalyticsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';

// counts renders based on console.debug log emitted by AnalyticsPage

describe('AnalyticsPage render with derived KPI feature flag', () => {
  it('renders a finite number of times when flag toggles', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let renderCalls = 0;
    let errorCalls = 0;
    const client = new QueryClient();
    const { rerender } = render(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <AnalyticsPage key="on" data={{ metricKeys: [] }} />
        </TooltipProvider>
      </QueryClientProvider>
    );
    ;

    (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = false;

    rerender(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <AnalyticsPage key="off" data={{ metricKeys: [] }} />
        </TooltipProvider>
      </QueryClientProvider>
    );

    renderCalls = debugSpy.mock.calls.filter((args) =>
      typeof args[0] === 'string' && args[0].includes('[AnalyticsPage] render')
    ).length;
    errorCalls = errorSpy.mock.calls.length;

    debugSpy.mockRestore();
    errorSpy.mockRestore();

    expect(renderCalls).toBe(2);
    expect(errorCalls).toBe(0);
  });
});

