import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TrainingSessionPage from '@/pages/TrainingSession';
import { useWorkoutStore } from '@/store/workoutStore';
import { FEATURE_FLAGS } from '@/constants/featureFlags';

const openSpy = vi.fn();
let onOpenChangeRef: ((open: boolean) => void) | null = null;

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
vi.mock('@/hooks/useWorkoutSave', () => ({
  useWorkoutSave: () => ({ handleCompleteWorkout: () => {}, saveStatus: 'idle', savingErrors: [] })
}));
vi.mock('@/context/WeightUnitContext', () => ({ useWeightUnit: () => ({ weightUnit: 'kg' }) }));
vi.mock('@/components/training/WorkoutSessionHeader', () => ({ WorkoutSessionHeader: () => null }));
vi.mock('@/components/training/ExerciseList', () => ({ ExerciseList: () => null }));
vi.mock('@/components/training/AddExerciseSheet', () => ({
  AddExerciseSheet: ({ open, onOpenChange }: any) => {
    openSpy(open);
    onOpenChangeRef = onOpenChange;
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

function renderPage(entry: any) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/training-session" element={<TrainingSessionPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  openSpy.mockReset();
  onOpenChangeRef = null;
  useWorkoutStore.setState({ exercises: {}, trainingConfig: {} });
  (FEATURE_FLAGS as any).DEBUG_EXERCISE_SELECTOR_OPEN = false;
});

describe('TrainingSession manual selector behavior', () => {
  test('manual flag opens selector then stays closed after remount', async () => {
    const { unmount } = renderPage({ pathname: '/training-session', state: { manual: true } });
    await Promise.resolve();
    expect(openSpy.mock.calls.some(([open]) => open)).toBe(true);
    act(() => { onOpenChangeRef?.(false); });
    await Promise.resolve();
    expect(openSpy.mock.calls.at(-1)[0]).toBe(false);
    unmount();
    openSpy.mockReset();
    renderPage({ pathname: '/training-session' });
    expect(openSpy.mock.calls.some(([open]) => open)).toBe(false);
  });

  test('query param opens selector once', async () => {
    const { unmount } = renderPage({ pathname: '/training-session', search: '?open=exercises' });
    await Promise.resolve();
    expect(openSpy.mock.calls.some(([open]) => open)).toBe(true);
    act(() => { onOpenChangeRef?.(false); });
    unmount();
    openSpy.mockReset();
    renderPage({ pathname: '/training-session' });
    expect(openSpy.mock.calls.some(([open]) => open)).toBe(false);
  });

  test('debug logs emitted once when flag enabled', async () => {
    (FEATURE_FLAGS as any).DEBUG_EXERCISE_SELECTOR_OPEN = true;
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { unmount } = renderPage({ pathname: '/training-session', state: { manual: true } });
    await Promise.resolve();
    const openLogs = logSpy.mock.calls.filter(call => call[0] === '[exerciseSheet] open');
    expect(openLogs.length).toBe(1);
    unmount();
    logSpy.mockClear();
    renderPage({ pathname: '/training-session' });
    const openLogs2 = logSpy.mock.calls.filter(call => call[0] === '[exerciseSheet] open');
    expect(openLogs2.length).toBe(0);
    logSpy.mockRestore();
  });
});

