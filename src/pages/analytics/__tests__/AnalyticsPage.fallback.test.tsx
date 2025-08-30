import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { AnalyticsPage } from '../AnalyticsPage';
import { TooltipProvider } from '@/components/ui/tooltip';
import { renderWithProviders } from '../../../../tests/utils/renderWithProviders';

vi.mock('recharts', async () => await import('../../../../tests/mocks/recharts'));

describe('AnalyticsPage measure fallback', () => {
  it('resets currentMeasure when unavailable', () => {
    const first = {
      series: {
        tonnage_kg: [{ date: '2024-01-01', value: 1000 }],
        duration_min: [{ date: '2024-01-01', value: 60 }],
      },
      metricKeys: ['tonnage_kg', 'duration_min'],
    };
    const second = {
      series: { tonnage_kg: [{ date: '2024-01-01', value: 1000 }] },
      metricKeys: ['tonnage_kg'],
    };
    const { rerender } = renderWithProviders(
      <TooltipProvider>
        <AnalyticsPage data={first} />
      </TooltipProvider>
    );
    const select = document.querySelector('[data-testid="metric-select"]') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'duration_min' } });
    rerender(
      <TooltipProvider>
        <AnalyticsPage data={second} />
      </TooltipProvider>
    );
    const updated = document.querySelector('[data-testid="metric-select"]') as HTMLSelectElement;
    expect(updated.value).toBe('tonnage_kg');
  });
});
