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

  it('toggle OFF → base cards, no measures available', () => {
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
    expect(select.options.length).toBe(0);
    expect(screen.getByTestId('kpi-sets')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-tonnage')).toBeInTheDocument();
    expect(screen.queryByTestId('kpi-density')).toBeNull();
  });

  it('toggle ON → derived cards allowed', () => {
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
    expect(select.options.length).toBe(0);
    expect(screen.getByTestId('kpi-density')).toBeInTheDocument();
  });
});
