import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { SetRow } from '@/components/SetRow';
import { setFlagOverride } from '@/constants/featureFlags';

vi.mock('lucide-react', () => ({
  MinusCircle: () => null,
  PlusCircle: () => null,
  Save: () => null,
  Trash2: () => null,
  Edit: () => null,
  Check: () => null,
  Timer: () => null,
}));

vi.mock('@/context/WeightUnitContext', () => ({ useWeightUnit: () => ({ weightUnit: 'kg' }) }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/useExerciseWeight', () => ({
  useExerciseWeight: () => ({
    weight: 0,
    isAutoWeight: false,
    weightSource: 'manual',
    updateWeight: () => {},
    resetToAuto: () => {},
  }),
}));
vi.mock('@/components/ui/input', () => ({ Input: (props: any) => <input {...props} /> }));
vi.mock('@/components/ui/button', () => ({ Button: (props: any) => <button {...props} /> }));
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/hooks/useRestTimeAnalytics', () => ({ useRestTimeAnalytics: () => ({ logRestTime: () => {} }) }));
vi.mock('@/hooks/useGlobalRestTimers', () => ({
  useGlobalRestTimers: () => ({
    generateTimerId: () => 'id',
    isTimerActive: () => false,
    stopTimer: () => {},
    getTimer: () => null,
  }),
}));
vi.mock('@/components/CompactRestTimer', () => ({ CompactRestTimer: () => null }));
vi.mock('@/utils/restDisplay', () => ({
  getDisplayRestLabelByIndex: () => ({ type: 'duration', value: 60 }),
  formatRestForDisplay: () => '',
}));

const startSet = vi.fn();
vi.mock('@/store/workoutStore', () => ({
  useWorkoutStore: () => ({ startSet, setSetStartTime: () => {}, setSetEndTime: () => {} }),
}));

describe('SetRow startSet dispatch', () => {
  beforeEach(() => {
    startSet.mockReset();
    setFlagOverride('REST_FREEZE_ON_START', true);
  });

  function renderRow() {
    return render(
      <SetRow
        setNumber={1}
        weight={0}
        reps={0}
        completed={false}
        isEditing={true}
        exerciseName="Bench"
        onComplete={() => {}}
        onEdit={() => {}}
        onSave={() => {}}
        onRemove={() => {}}
        onWeightChange={() => {}}
        onRepsChange={() => {}}
        onWeightIncrement={() => {}}
        onRepsIncrement={() => {}}
        weightUnit="kg"
      />,
    );
  }

  test('pointerDown then input focus triggers startSet only once', () => {
    const { getByPlaceholderText, getAllByRole } = renderRow();
    fireEvent.pointerDown(getAllByRole('button')[0]);
    const input = getByPlaceholderText('Weight');
    fireEvent.focus(input);
    expect(startSet).toHaveBeenCalledTimes(1);
  });
});

