import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { PerWorkoutMetrics } from '@/services/metrics-v2/dto';
import { AnalyticsPage } from '../AnalyticsPage';

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
      kpis: { densityKgPerMin: 10, avgRestSec: 60, setEfficiency: 1.0 },
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
      kpis: { densityKgPerMin: 20, avgRestSec: 30, setEfficiency: 0.8 },
    });
  }
  return workouts;
};

describe('AnalyticsPage KPI cards', () => {
  it('renders KPI cards when enabled', () => {
    const workouts = makeWorkouts();
    const { container, getByTestId } = render(<AnalyticsPage perWorkout={workouts} />);
    expect(getByTestId('kpi-density')).toBeTruthy();
    expect(container).toMatchSnapshot();
  });

  it('hides KPI cards when disabled', () => {
    const workouts = makeWorkouts();
    const { queryByTestId } = render(<AnalyticsPage perWorkout={workouts} />);
    expect(queryByTestId('kpi-density')).toBeNull();
  });
});
