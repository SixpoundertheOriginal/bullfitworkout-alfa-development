import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import TrainingSessionPage from '@/pages/TrainingSession';
import { useWorkoutStore } from '@/store/workoutStore';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { useLocation } from 'react-router-dom';

const navigateMock = vi.fn();
const openSpy = vi.fn();

vi.mock('react-router-dom', () => ({
  useLocation: vi.fn(),
  useNavigate: () => navigateMock,
}));

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
  }),
}));
vi.mock('@/hooks/useWorkoutSave', () => ({ useWorkoutSave: () => ({ handleCompleteWorkout: () => {}, saveStatus: 'idle', savingErrors: [] }) }));
vi.mock('@/context/WeightUnitContext', () => ({ useWeightUnit: () => ({ weightUnit: 'kg' }) }));
vi.mock('@/components/training/WorkoutSessionHeader', () => ({ WorkoutSessionHeader: () => null }));
vi.mock('@/components/training/ExerciseList', () => ({ ExerciseList: () => null }));
vi.mock('@/components/training/AddExerciseSheet', () => ({
  AddExerciseSheet: ({ open }: any) => {
    openSpy(open);
    return null;
  },
}));
vi.mock('@/components/training/FinishWorkoutDialog', () => ({ FinishWorkoutDialog: () => null }));
vi.mock('@/components/training/RealTimeEfficiencyMonitor', () => ({ RealTimeEfficiencyMonitor: () => null }));
vi.mock('@/components/training/WorkoutPredictionEngine', () => ({ WorkoutPredictionEngine: () => null }));
vi.mock('@/components/RestTimer', () => ({ RestTimer: () => null }));
vi.mock('@/components/TimingDebugPanel', () => ({ TimingDebugPanel: () => null }));
vi.mock('@/components/ui/UniversalCard', () => ({ UniversalCard: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/ui/AppBackground', () => ({ AppBackground: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/training/WorkoutSessionLayout', () => ({ WorkoutSessionLayout: ({ children }: any) => <div>{children}</div> }));

beforeEach(() => {
  navigateMock.mockReset();
  openSpy.mockReset();
  (useLocation as any).mockReturnValue({ state: {}, search: '', pathname: '/training-session' });
  useWorkoutStore.setState({ 
    exercises: {}, 
    trainingConfig: { trainingType: 'strength', tags: [], duration: 60 }
  });
  (FEATURE_FLAGS as any).DEBUG_EXERCISE_SELECTOR_OPEN = false;
});

describe('TrainingSession exercise sheet', () => {
  test('opens when manual intent present', () => {
    (useLocation as any).mockReturnValue({ state: { manual: true }, search: '', pathname: '/training-session' });
    render(<TrainingSessionPage />);
    expect(openSpy.mock.calls.some(([open]) => open)).toBe(true);
    expect(navigateMock).toHaveBeenCalledWith('/training-session', { replace: true });
  });

  test('opens when query param present', () => {
    (useLocation as any).mockReturnValue({ state: {}, search: '?open=exercises', pathname: '/training-session' });
    render(<TrainingSessionPage />);
    expect(openSpy.mock.calls.some(([open]) => open)).toBe(true);
    expect(navigateMock).toHaveBeenCalledWith('/training-session', { replace: true });
  });

  test('logs when debug flag enabled', () => {
    (FEATURE_FLAGS as any).DEBUG_EXERCISE_SELECTOR_OPEN = true;
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    (useLocation as any).mockReturnValue({ state: { manual: true }, search: '', pathname: '/training-session' });
    render(<TrainingSessionPage />);
    expect(logSpy.mock.calls.some(call => call[0] === '[exerciseSheet] open' && call[1]?.source === 'manual')).toBe(true);
    logSpy.mockRestore();
  });
});

