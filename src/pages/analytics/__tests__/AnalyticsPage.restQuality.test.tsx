import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { setFlagOverride } from '@/constants/featureFlags';
import AnalyticsPage from '../AnalyticsPage';
import { render } from '@testing-library/react';
import { AVG_REST_ID } from '../metricIds';

vi.mock('recharts', async () => await import('../../../../tests/mocks/recharts'));

const renderPage = (data: any) => {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <AnalyticsPage data={data} />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

describe('Avg Rest KPI gating', () => {
  beforeEach(() => {
    setFlagOverride('ANALYTICS_DERIVED_KPIS_ENABLED', true);
  });

  it('shows avg rest with confidence when quality is high', () => {
    const data = {
      series: { [AVG_REST_ID]: [{ date: '2024-01-01', value: 30 }] },
      totals: { [AVG_REST_ID]: 30 },
      timingMetadata: { coveragePct: 100, quality: 'high' as const },
    };
    const { getByTestId } = renderPage(data);
    expect(getByTestId('kpi-rest')).toBeInTheDocument();
    expect(getByTestId('rest-confidence').textContent).toMatch(/High timing confidence/);
  });

  it('hides avg rest value when timing quality is low', () => {
    const data = {
      series: { [AVG_REST_ID]: [{ date: '2024-01-01', value: 30 }] },
      totals: { [AVG_REST_ID]: 30 },
      timingMetadata: { coveragePct: 10, quality: 'low' as const },
    };
    const { queryByTestId, getByTestId } = renderPage(data);
    expect(queryByTestId('kpi-rest')).toBeNull();
    expect(getByTestId('kpi-rest-fallback')).toBeInTheDocument();
  });

  it('respects feature flag disable', () => {
    setFlagOverride('ANALYTICS_DERIVED_KPIS_ENABLED', false);
    const data = {
      series: { [AVG_REST_ID]: [{ date: '2024-01-01', value: 30 }] },
      totals: { [AVG_REST_ID]: 30 },
      timingMetadata: { coveragePct: 100, quality: 'high' as const },
    };
    const { queryByTestId } = renderPage(data);
    expect(queryByTestId('kpi-rest')).toBeNull();
    expect(queryByTestId('kpi-rest-fallback')).toBeNull();
  });
});

