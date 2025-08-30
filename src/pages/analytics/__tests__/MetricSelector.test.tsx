import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AnalyticsPage from '../AnalyticsPage';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import type { TimeSeriesPoint } from '@/services/metrics-v2/dto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TONNAGE_ID, DENSITY_ID, SETS_ID, REPS_ID, DURATION_ID } from '../metricIds';

describe('metric selector and KPI gating', () => {
  const baseTotals = {
    [TONNAGE_ID]: 100,
    [SETS_ID]: 10,
    [REPS_ID]: 100,
    [DURATION_ID]: 60,
    [DENSITY_ID]: 5,
  } as Record<string, number>;
  const data = {
    perWorkout: [],
    series: {} as Record<string, TimeSeriesPoint[]>,
    totals: baseTotals,
  };

  it('toggle OFF → base cards and 4 base measures', () => {
    (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = false;
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <AnalyticsPage data={data} />
        </TooltipProvider>
      </QueryClientProvider>
    );
    const select = screen.getByTestId('metric-select') as HTMLSelectElement;
    expect(select.options.length).toBe(4);
    expect(screen.getByTestId('kpi-sets')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-tonnage')).toBeInTheDocument();
    expect(screen.queryByTestId('kpi-density')).toBeNull();
  });

  it('toggle ON → derived cards and selector adds density', () => {
    (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = true;
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <AnalyticsPage data={data} />
        </TooltipProvider>
      </QueryClientProvider>
    );
    const select = screen.getByTestId('metric-select') as HTMLSelectElement;
    expect(select.options.length).toBe(5);
    expect(screen.getByTestId('kpi-density')).toBeInTheDocument();
  });

  it('derived selected then toggled OFF → resets to tonnage', () => {
    (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = true;
    const client = new QueryClient();
    const { rerender } = render(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <AnalyticsPage key="on" data={data} />
        </TooltipProvider>
      </QueryClientProvider>
    );
    const select = screen.getByTestId('metric-select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: DENSITY_ID } });
    (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = false;
    rerender(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <AnalyticsPage key="off" data={data} />
        </TooltipProvider>
      </QueryClientProvider>
    );
    const updated = screen.getByTestId('metric-select') as HTMLSelectElement;
    expect(updated.options.length).toBe(4);
    expect(updated.value).toBe(TONNAGE_ID);
  });
});
