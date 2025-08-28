import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkoutDetailsEnhanced } from '@/components/workouts/WorkoutDetailsEnhanced';
import { WeightUnitProvider } from '@/context/WeightUnitContext';

function renderWithWeightUnit(ui: React.ReactNode) {
  return render(
    <WeightUnitProvider value={{
      weightUnit: 'kg',
      setWeightUnit: () => {},
      saveWeightUnitPreference: async () => {},
      isDefaultUnit: true,
      isLoading: false,
    }}>
      {ui}
    </WeightUnitProvider>
  );
}

describe('Details page rest rendering (failing first)', () => {
  test('renders Pending for null rest, exact numeric otherwise', () => {
    // Polyfill ResizeObserver for recharts components
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    const workout = {
      id: 'w1',
      name: 'Test Workout',
      training_type: 'strength',
      start_time: new Date().toISOString(),
      duration: 30,
      notes: null,
    };
    const exercises = {
      'Bench Press': [
        { id: 's1', set_number: 1, exercise_name: 'Bench Press', workout_id: 'w1', weight: 100, reps: 5, completed: true, restTime: 30 } as any,
        { id: 's2', set_number: 2, exercise_name: 'Bench Press', workout_id: 'w1', weight: 100, reps: 5, completed: true, restTime: 70 } as any,
        { id: 's3', set_number: 3, exercise_name: 'Bench Press', workout_id: 'w1', weight: 100, reps: 5, completed: true, restTime: null } as any,
      ]
    };

    renderWithWeightUnit(
      <WorkoutDetailsEnhanced
        workout={workout as any}
        exercises={exercises as any}
        onEditClick={() => {}}
      />
    );

    // Desired behavior:
    // - First set shows 00:30
    // - Second set shows 01:10
    // - Third set shows Pending (NOT 60s)
    // These assertions will FAIL with current `|| 60` logic.
    expect(screen.getByText('00:30')).toBeInTheDocument();
    expect(screen.getByText('01:10')).toBeInTheDocument();
    expect(screen.getByText(/Pending|—/i)).toBeInTheDocument();
  });
});
