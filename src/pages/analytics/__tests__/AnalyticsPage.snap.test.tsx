import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { PerWorkoutMetrics, TimeSeriesPoint } from '@/services/metrics-v2/dto';
import { AnalyticsPage } from '../AnalyticsPage';
import { ConfigProvider } from '@/config/runtimeConfig';

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
      series: { volume: [], sets: [], workouts: [], duration: [], reps: [], density: [], avgRest: [], setEfficiency: [] } as Record<string, TimeSeriesPoint[]>,
      metricKeys: ['volume','sets','workouts','duration','reps','density','avgRest','setEfficiency'],
    };
    const { container, getByTestId } = render(
      <ConfigProvider initialFlags={{ derivedKpis: true }}>
        <AnalyticsPage data={data} />
      </ConfigProvider>
    );
    expect(getByTestId('kpi-density')).toBeTruthy();
    expect(container).toMatchSnapshot();
  });

  it('hides KPI cards when disabled', () => {
    const workouts = makeWorkouts();
    const data = {
      perWorkout: workouts,
      series: { volume: [], sets: [], workouts: [], duration: [], reps: [], density: [], avgRest: [], setEfficiency: [] } as Record<string, TimeSeriesPoint[]>,
      metricKeys: ['volume','sets','workouts','duration','reps','density','avgRest','setEfficiency'],
    };
    const { queryByTestId } = render(
      <ConfigProvider initialFlags={{ derivedKpis: false }}>
        <AnalyticsPage data={data} />
      </ConfigProvider>
    );
    expect(queryByTestId('kpi-density')).toBeNull();
  });
});
