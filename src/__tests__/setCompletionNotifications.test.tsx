import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { SetRow } from '@/components/SetRow';
import TrainingSessionPage from '@/pages/TrainingSession';
import { useWorkoutStore } from '@/store/workoutStore';
import { logExerciseFeedback } from '@/services/exerciseFeedbackService';

// Mocks for SetRow dependencies
vi.mock('@/context/WeightUnitContext', () => ({ useWeightUnit: () => ({ weightUnit: 'kg' }) }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/useExerciseWeight', () => ({
  useExerciseWeight: () => ({
    weight: 100,
    isAutoWeight: false,
    weightSource: 'manual',
    updateWeight: vi.fn(),
    resetToAuto: vi.fn(),
  })
}));
vi.mock('@/hooks/useRestTimeAnalytics', () => ({ useRestTimeAnalytics: () => ({ logRestTime: vi.fn() }) }));
vi.mock('@/hooks/useGlobalRestTimers', () => ({
  useGlobalRestTimers: () => ({
    generateTimerId: () => 'timer1',
    isTimerActive: () => false,
    stopTimer: vi.fn(),
    getTimer: vi.fn(),
  })
}));

// Mocks for TrainingSession dependencies
vi.mock('react-router-dom', () => ({ useLocation: () => ({ state: {} }), useNavigate: () => vi.fn() }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));
vi.mock('@/hooks/useExercises', () => ({ useExercises: () => ({ exercises: [], isLoading: false }) }));
vi.mock('@/hooks/useWorkoutTimer', () => ({ useWorkoutTimer: () => {} }));
vi.mock('@/hooks/useSound', () => ({ useSound: () => ({ play: () => {} }) }));
vi.mock('@/hooks/useEnhancedRestAnalytics', () => ({
  useEnhancedRestAnalytics: () => ({
    startRestTimer: () => {},
    endRestTimer: () => {},
    getRestAnalytics: () => ({}),
    getCurrentRestTime: () => 0,
    getOptimalRestSuggestion: () => 0,
  })
}));
vi.mock('@/hooks/useWorkoutSave', () => ({ useWorkoutSave: () => ({ handleCompleteWorkout: () => {}, saveStatus: 'idle', savingErrors: [] }) }));
vi.mock('@/components/training/WorkoutSessionHeader', () => ({ WorkoutSessionHeader: () => null }));
vi.mock('@/components/training/AddExerciseSheet', () => ({ AddExerciseSheet: () => null }));
vi.mock('@/components/training/FinishWorkoutDialog', () => ({ FinishWorkoutDialog: () => null }));
vi.mock('@/components/training/RealTimeEfficiencyMonitor', () => ({ RealTimeEfficiencyMonitor: () => null }));
vi.mock('@/components/training/WorkoutPredictionEngine', () => ({ WorkoutPredictionEngine: () => null }));
vi.mock('@/components/RestTimer', () => ({ RestTimer: () => null }));
vi.mock('@/components/TimingDebugPanel', () => ({ TimingDebugPanel: () => null }));
vi.mock('@/components/ui/UniversalCard', () => ({ UniversalCard: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/ui/AppBackground', () => ({ AppBackground: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/training/WorkoutSessionLayout', () => ({ WorkoutSessionLayout: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/training/ExerciseList', () => ({
  ExerciseList: ({ onCompleteSet }: any) => (
    <button onClick={() => onCompleteSet('Bench Press', 0, { startTime: '', endTime: '', actualRestTime: 0 })}>
      complete
    </button>
  ),
}));

vi.mock('@/services/exerciseFeedbackService', () => ({
  logExerciseFeedback: vi.fn().mockResolvedValue(undefined),
}));

// Actual tests

describe('Set completion notifications', () => {
  test('TrainingSession skips prompts and logs null feedback when flag disabled', () => {
    const promptSpy = vi.spyOn(window, 'prompt');
    const feedbackMock = vi.mocked(logExerciseFeedback);

    useWorkoutStore.setState({
      exercises: {
        'Bench Press': [
          { weight: 100, reps: 5, restTime: 60, completed: false, metadata: {}, exercise_id: 'ex1' } as any,
        ],
      },
      workoutId: 'w1',
    });

    const { getByText } = render(<TrainingSessionPage />);
    fireEvent.click(getByText('complete'));

    expect(promptSpy).not.toHaveBeenCalled();
    expect(feedbackMock).toHaveBeenCalledWith({
      workoutId: 'w1',
      exerciseId: 'ex1',
      perceivedDifficulty: null,
      satisfaction: null,
    });
  });
});

