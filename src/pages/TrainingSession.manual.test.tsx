import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { vi } from 'vitest';
import TrainingSessionPage from './TrainingSession';
import { useWorkoutStore } from '@/store/workoutStore';

vi.mock('@/components/training/AddExerciseSheet', () => ({
  AddExerciseSheet: ({ open, onSelectExercise }: any) =>
    open ? (
      <div>
        <button data-testid="sheet-add" onClick={() => onSelectExercise('Push Up')}>
          add
        </button>
      </div>
    ) : null,
}));

vi.mock('@/components/training/FinishWorkoutDialog', () => ({ FinishWorkoutDialog: () => null }));
vi.mock('@/hooks/useWorkoutTimer', () => ({ useWorkoutTimer: () => {} }));
vi.mock('@/hooks/useExercises', () => ({ useExercises: () => ({ exercises: [], isLoading: false }) }));
vi.mock('@/components/training/WorkoutSessionHeader', () => ({ WorkoutSessionHeader: () => null }));
vi.mock('@/components/training/ExerciseList', () => ({ ExerciseList: () => null }));
vi.mock('@/components/RestTimer', () => ({ RestTimer: () => null }));
vi.mock('@/components/training/RealTimeEfficiencyMonitor', () => ({ RealTimeEfficiencyMonitor: () => null }));
vi.mock('@/components/training/WorkoutPredictionEngine', () => ({ WorkoutPredictionEngine: () => null }));
vi.mock('@/context/WeightUnitContext', () => ({ useWeightUnit: () => ({ weightUnit: 'kg' }) }));
vi.mock('@/hooks/useSound', () => ({ useSound: () => ({ play: () => {} }) }));
vi.mock('@/hooks/useEnhancedRestAnalytics', () => ({
  useEnhancedRestAnalytics: () => ({
    startRestTimer: () => {},
    endRestTimer: () => {},
    getRestAnalytics: () => ({}),
    getCurrentRestTime: () => 0,
    getOptimalRestSuggestion: () => 0,
  }),
}));
vi.mock('@/components/training/WorkoutSessionLayout', () => ({ WorkoutSessionLayout: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/hooks/useWorkoutSave', () => ({ useWorkoutSave: () => ({ handleCompleteWorkout: vi.fn(), saveStatus: 'idle', savingErrors: [] }) }));
vi.mock('@/components/TimingDebugPanel', () => ({ TimingDebugPanel: () => null }));
vi.mock('@/components/ui/AppBackground', () => ({ AppBackground: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/ui/button', () => ({ Button: (props: any) => <button {...props} /> }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: '1' } }) }));

describe('TrainingSession manual path', () => {
  test('opens sheet and starts session on first add', () => {
    const wrapper = ({ children }: any) => (
      <MemoryRouter initialEntries={[{ pathname: '/training-session', state: { manual: true } }]}> 
        <Routes>
          <Route path="/training-session" element={children} />
        </Routes>
      </MemoryRouter>
    );

    useWorkoutStore.getState().resetSession();
    render(<TrainingSessionPage />, { wrapper });

    expect(screen.getByTestId('sheet-add')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('sheet-add'));
    expect(useWorkoutStore.getState().isActive).toBe(true);
  });
});
