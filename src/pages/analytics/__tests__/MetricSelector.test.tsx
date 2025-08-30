import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AnalyticsPage from '../AnalyticsPage';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import type { TimeSeriesPoint } from '@/services/metrics-v2/dto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';

describe('metric selector and KPI gating', () => {
  it('renders options based on flag and recovers metric on flag disable', () => {
      const data = {
        perWorkout: [],
        series: {} as Record<string, TimeSeriesPoint[]>,
      };
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
      expect(select.options.length).toBe(2);
      expect(screen.getByTestId('kpi-density')).toBeInTheDocument();

      fireEvent.change(select, { target: { value: 'density_kg_min' } });
    (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = false;

    rerender(
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <AnalyticsPage key="off" data={data} />
        </TooltipProvider>
      </QueryClientProvider>
    );

      const updated = screen.getByTestId('metric-select') as HTMLSelectElement;
      expect(updated.options.length).toBe(1);
      expect(updated.value).toBe('tonnage_kg');
      expect(screen.queryByTestId('kpi-density')).toBeNull();
    });
  });
