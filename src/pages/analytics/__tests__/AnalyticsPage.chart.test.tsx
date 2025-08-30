import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { AnalyticsPage } from '../AnalyticsPage';
import { TooltipProvider } from '@/components/ui/tooltip';
import { renderWithProviders } from '../../../../tests/utils/renderWithProviders';

vi.mock('recharts', async () => await import('../../../../tests/mocks/recharts'));

describe('AnalyticsPage chart', () => {
  it('renders chart when series has data', () => {
    const data = {
      series: {
        tonnage_kg: [{ date: '2024-01-01', value: 10 }],
      },
      metricKeys: ['tonnage_kg'],
    };
    const { getByTestId, queryByTestId } = renderWithProviders(
      <TooltipProvider>
        <AnalyticsPage data={data} />
      </TooltipProvider>
    );
    expect(getByTestId('chart')).toBeDefined();
    expect(queryByTestId('empty-series')).toBeNull();
  });

  it('renders density chart when density series present', () => {
    const data = {
      series: {
        density_kg_per_min: [{ date: '2024-01-01', value: 5 }],
      },
      metricKeys: ['density_kg_per_min'],
    };
    const { getByTestId, queryByTestId } = renderWithProviders(
      <TooltipProvider>
        <AnalyticsPage data={data} />
      </TooltipProvider>
    );
    expect(getByTestId('chart')).toBeDefined();
    expect(queryByTestId('measure-note')).toBeNull();
  });
});
