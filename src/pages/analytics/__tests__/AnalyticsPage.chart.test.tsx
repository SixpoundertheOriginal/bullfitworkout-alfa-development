import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AnalyticsPage from '../AnalyticsPage';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import type { TimeSeriesPoint } from '@/services/metrics-v2/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TONNAGE_ID, AVG_REST_ID, EFF_ID } from '../metricIds';
import { formatSeconds, formatKgPerMin } from '../formatters';

describe('AnalyticsPage chart', () => {
  const baseSeries = {
    [TONNAGE_ID]: [{ date: '2024-01-01', value: 100 }],
    [AVG_REST_ID]: [{ date: '2024-01-01', value: 30 }],
    [EFF_ID]: [{ date: '2024-01-01', value: 1 }],
  } as Record<string, TimeSeriesPoint[]>;
  const totals = { [TONNAGE_ID]: 100, [AVG_REST_ID]: 30, [EFF_ID]: 1 };

  it('shows derived options and formats tooltips when flag enabled', async () => {
    (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = true;
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <AnalyticsPage data={{ perWorkout: [], series: baseSeries, totals }} />
        </TooltipProvider>
      </QueryClientProvider>
    );
    const trigger = screen.getByTestId('metric-select');
    fireEvent.click(trigger);
    const content = screen.getByRole('listbox');
    expect(within(content).getByText('Avg Rest (sec)')).toBeInTheDocument();
    expect(within(content).getByText('Set Efficiency (kg/min)')).toBeInTheDocument();
    fireEvent.click(within(content).getByText('Avg Rest (sec)'));
    expect(await screen.findByText(formatSeconds(30))).toBeInTheDocument();
    fireEvent.click(trigger);
    const content2 = screen.getByRole('listbox');
    fireEvent.click(within(content2).getByText('Set Efficiency (kg/min)'));
    expect(await screen.findByText(/kg\/min/)).toBeInTheDocument();
  }, 10000);

  it('hides derived options when flag disabled', () => {
    (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = false;
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <AnalyticsPage data={{ perWorkout: [], series: baseSeries, totals }} />
        </TooltipProvider>
      </QueryClientProvider>
    );
    const trigger = screen.getByTestId('metric-select');
    fireEvent.click(trigger);
    expect(screen.queryByText('Avg Rest (sec)')).toBeNull();
    expect(screen.queryByText('Set Efficiency (kg/min)')).toBeNull();
  });
});

