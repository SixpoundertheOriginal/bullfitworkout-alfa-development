import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { AnalyticsPage } from '../AnalyticsPage';
import { TooltipProvider } from '@/components/ui/tooltip';
import { renderWithProviders } from '../../../../tests/utils/renderWithProviders';
import { DENSITY_ID } from '../metricIds';

vi.mock('recharts', async () => await import('../../../../tests/mocks/recharts'));
vi.mock('@/constants/featureFlags', () => ({
  useFeatureFlags: () => ({
    KPI_ANALYTICS_ENABLED: true,
    KPI_DIAGNOSTICS_ENABLED: false,
    ANALYTICS_DERIVED_KPIS_ENABLED: false,
    ANALYTICS_V2_ENABLED: false,
    SETUP_CHOOSE_EXERCISES_ENABLED: false,
    SET_COMPLETE_NOTIFICATIONS_ENABLED: false,
    REST_FREEZE_ON_START: false,
  }),
  setFlagOverride: vi.fn(),
  FEATURE_FLAGS: {
    KPI_ANALYTICS_ENABLED: true,
    KPI_DIAGNOSTICS_ENABLED: false,
    ANALYTICS_DERIVED_KPIS_ENABLED: false,
    ANALYTICS_V2_ENABLED: false,
    SETUP_CHOOSE_EXERCISES_ENABLED: false,
    SET_COMPLETE_NOTIFICATIONS_ENABLED: false,
    REST_FREEZE_ON_START: false,
  },
}));

describe('AnalyticsPage density selector', () => {
  it('shows density option and formats tooltip with kg/min', () => {
    const data = {
      series: {
        tonnage_kg: [{ date: '2024-05-01', value: 2000 }],
        duration_min: [{ date: '2024-05-01', value: 40 }],
        density_kg_per_min: [{ date: '2024-05-01', value: 50 }],
      },
      metricKeys: ['tonnage_kg', 'duration_min', 'density_kg_per_min'],
    };
    const { container } = renderWithProviders(
      <TooltipProvider>
        <AnalyticsPage data={data} />
      </TooltipProvider>
    );
    const select = container.querySelector('[data-testid="metric-select"]') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: DENSITY_ID } });
    expect(select.value).toBe(DENSITY_ID);
    expect(container.textContent).toContain('Density (kg/min)');
    const dot = container.querySelector('circle.recharts-dot')!;
    fireEvent.mouseOver(dot);
    expect(screen.getByText(/kg\/min$/)).toBeInTheDocument();
  });
});
