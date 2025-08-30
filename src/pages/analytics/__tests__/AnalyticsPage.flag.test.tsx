import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { setFlagOverride } from '@/constants/featureFlags';
import { AnalyticsPage } from '../AnalyticsPage';
import { TooltipProvider } from '@/components/ui/tooltip';
import { renderWithProviders } from '../../../../tests/utils/renderWithProviders';

vi.mock('recharts', async () => await import('../../../../tests/mocks/recharts'));

afterEach(() => {
  setFlagOverride('ANALYTICS_DERIVED_KPIS_ENABLED', true);
});

// counts renders based on console.debug log emitted by AnalyticsPage

describe('AnalyticsPage render with derived KPI feature flag', () => {
  it('renders a finite number of times when flag toggles', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let renderCalls = 0;
    let errorCalls = 0;
    const { rerender } = renderWithProviders(
      <TooltipProvider>
        <AnalyticsPage key="on" data={{ metricKeys: [] }} />
      </TooltipProvider>
    );

    setFlagOverride('ANALYTICS_DERIVED_KPIS_ENABLED', false);

    rerender(
      <TooltipProvider>
        <AnalyticsPage key="off" data={{ metricKeys: [] }} />
      </TooltipProvider>
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
