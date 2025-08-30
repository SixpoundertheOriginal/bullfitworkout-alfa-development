import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import type { PerWorkoutMetrics, TimeSeriesPoint } from '@/services/metrics-v2/dto';
import { setFlagOverride } from '@/constants/featureFlags';
import { AnalyticsPage } from '../AnalyticsPage';
import { TooltipProvider } from '@/components/ui/tooltip';
import { renderWithProviders } from '../../../../tests/utils/renderWithProviders';

vi.mock('recharts', async () => await import('../../../../tests/mocks/recharts'));

afterEach(() => {
  setFlagOverride('ANALYTICS_DERIVED_KPIS_ENABLED', true);
});

const makeWorkouts = (): PerWorkoutMetrics[] => {
  const workouts: PerWorkoutMetrics[] = [];
  for (let i = 1; i <= 7; i++) {
    workouts.push({
      workoutId: `p${i}`,
      startedAt: `2023-01-${String(i).padStart(2, '0')}T10:00:00Z`,
      totalVolumeKg: 100,
      totalSets: 10,
      totalReps: 0,
      durationMin: 10,
      restMin: 10,
      kpis: { density: 10, avgRest: 60, setEfficiency: 1.0 },
    });
  }
  for (let i = 8; i <= 14; i++) {
    workouts.push({
      workoutId: `c${i}`,
      startedAt: `2023-01-${String(i).padStart(2, '0')}T10:00:00Z`,
      totalVolumeKg: 200,
      totalSets: 10,
      totalReps: 0,
      durationMin: 10,
      restMin: 5,
      kpis: { density: 20, avgRest: 30, setEfficiency: 0.8 },
    });
  }
  return workouts;
};

describe('AnalyticsPage KPI cards', () => {
  it('renders KPI cards when enabled', () => {
    const workouts = makeWorkouts();
    const data = {
      perWorkout: workouts,
      totals: {
        density_kg_min: 15,
        avg_rest_ms: 60000,
        set_efficiency_pct: 80,
      },
      series: {
        tonnage_kg: [],
        sets: [],
        workouts: [],
        duration: [],
        reps: [],
        density_kg_min: [],
        avg_rest_ms: [],
        set_efficiency_pct: [],
      } as Record<string, TimeSeriesPoint[]>,
    };
    setFlagOverride('ANALYTICS_DERIVED_KPIS_ENABLED', true);
    const { container, getByTestId } = renderWithProviders(
      <TooltipProvider>
        <AnalyticsPage data={data} />
      </TooltipProvider>
    );
    expect(getByTestId('kpi-density')).toBeTruthy();
    expect(container).toMatchSnapshot();
  });

  it('hides KPI cards when disabled', () => {
    const workouts = makeWorkouts();
    const data = {
      perWorkout: workouts,
      totals: {
        density_kg_min: 15,
        avg_rest_ms: 60000,
        set_efficiency_pct: 80,
      },
      series: {
        tonnage_kg: [],
        sets: [],
        workouts: [],
        duration: [],
        reps: [],
        density_kg_min: [],
        avg_rest_ms: [],
        set_efficiency_pct: [],
      } as Record<string, TimeSeriesPoint[]>,
    };
    setFlagOverride('ANALYTICS_DERIVED_KPIS_ENABLED', false);
    const { queryByTestId } = renderWithProviders(
      <TooltipProvider>
        <AnalyticsPage data={data} />
      </TooltipProvider>
    );
    expect(queryByTestId('kpi-density')).toBeNull();
  });
});
