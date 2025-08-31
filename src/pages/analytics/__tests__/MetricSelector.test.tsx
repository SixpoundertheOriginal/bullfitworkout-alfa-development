import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AnalyticsPage from '../AnalyticsPage';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import type { TimeSeriesPoint } from '@/services/metrics-v2/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TONNAGE_ID, DENSITY_ID, SETS_ID, REPS_ID, DURATION_ID, AVG_REST_ID, EFF_ID } from '../metricIds';

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
    timingMetadata: { coveragePct: 100, quality: 'high' as const },
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
    const trigger = screen.getByTestId('metric-select');
    fireEvent.click(trigger);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByTestId('kpi-sets')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-tonnage')).toBeInTheDocument();
    expect(screen.queryByTestId('kpi-density')).toBeNull();
    expect(screen.queryByTestId('kpi-rest')).toBeNull();
    expect(screen.queryByTestId('kpi-efficiency')).toBeNull();
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
    const trigger = screen.getByTestId('metric-select');
    fireEvent.click(trigger);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByTestId('kpi-density')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-rest')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-efficiency')).toBeInTheDocument();
  });

  it('hides rest and efficiency when flag off', () => {
    (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = false;
    const client = new QueryClient();
    const series = {
      [TONNAGE_ID]: [{ date: '2024-01-01', value: 1 }],
      [AVG_REST_ID]: [{ date: '2024-01-01', value: 30 }],
      [EFF_ID]: [{ date: '2024-01-01', value: 1 }],
    } as Record<string, TimeSeriesPoint[]>;
    const totals = { ...baseTotals, [AVG_REST_ID]: 30, [EFF_ID]: 1 };
    render(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <AnalyticsPage data={{ perWorkout: [], series, totals, timingMetadata: { coveragePct: 100, quality: 'high' } }} />
        </TooltipProvider>
      </QueryClientProvider>
    );
    const trigger = screen.getByTestId('metric-select');
    fireEvent.click(trigger);
    const content = screen.getByRole('listbox');
    expect(within(content).queryByText('Avg Rest (sec)')).toBeNull();
    expect(within(content).queryByText('Set Efficiency (kg/min)')).toBeNull();
  });

  it('shows rest and efficiency options when data available', () => {
    (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = true;
    const client = new QueryClient();
    const series = {
      [TONNAGE_ID]: [{ date: '2024-01-01', value: 1 }],
      [AVG_REST_ID]: [{ date: '2024-01-01', value: 30 }],
      [EFF_ID]: [{ date: '2024-01-01', value: 1 }],
    } as Record<string, TimeSeriesPoint[]>;
    const totals = { ...baseTotals, [AVG_REST_ID]: 30, [EFF_ID]: 1 };
    render(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <AnalyticsPage data={{ perWorkout: [], series, totals, timingMetadata: { coveragePct: 100, quality: 'high' } }} />
        </TooltipProvider>
      </QueryClientProvider>
    );
    const trigger = screen.getByTestId('metric-select');
    fireEvent.click(trigger);
    const content = screen.getByRole('listbox');
    expect(within(content).getByText('Avg Rest (sec)')).toBeInTheDocument();
    expect(within(content).getByText('Set Efficiency (kg/min)')).toBeInTheDocument();
  });
});
