import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { AnalyticsPage } from '../AnalyticsPage';
import { TooltipProvider } from '@/components/ui/tooltip';
import { renderWithProviders } from '../../../../tests/utils/renderWithProviders';

vi.mock('recharts', async () => await import('../../../../tests/mocks/recharts'));

describe('AnalyticsPage defaults', () => {
  it('renders without workout data', () => {
    const { getByTestId } = renderWithProviders(
      <TooltipProvider>
        <AnalyticsPage />
      </TooltipProvider>
    );
    expect(getByTestId('metric-select')).not.toBeDisabled();
    expect(getByTestId('empty-series').textContent).toBe('No data to display');
  });
});
