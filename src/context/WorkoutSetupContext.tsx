import { createContext, useContext, useMemo, useState } from 'react';
import type { Exercise } from '@/types/exercise';
import type { TrainingFocus } from '@/types/training-setup';

interface WorkoutSetupState {
  selectedFocus: TrainingFocus | null;
  selectedSubFocus: string | null;
  generatedProgram: Exercise[] | null;
  currentStep: number;
  isComplete: boolean;
}

interface WorkoutSetupContextValue {
  state: WorkoutSetupState;
  actions: {
    setSelectedFocus: (focus: TrainingFocus | null) => void;
    setSelectedSubFocus: (subFocus: string) => void;
    setGeneratedProgram: (program: Exercise[]) => void;
    nextStep: () => void;
    previousStep: () => void;
    reset: () => void;
  };
}

const WorkoutSetupContext = createContext<WorkoutSetupContextValue | undefined>(undefined);

export const WorkoutSetupProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<WorkoutSetupState>({
    selectedFocus: null,
    selectedSubFocus: null,
    generatedProgram: null,
    currentStep: 1,
    isComplete: false,
  });

  const actions = useMemo(
    () => ({
      setSelectedFocus: (focus: TrainingFocus | null) =>
        setState((prev) => ({ ...prev, selectedFocus: focus })),
      setSelectedSubFocus: (subFocus: string) =>
        setState((prev) => ({ ...prev, selectedSubFocus: subFocus })),
      setGeneratedProgram: (program: Exercise[]) =>
        setState((prev) => ({ ...prev, generatedProgram: program })),
      nextStep: () =>
        setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 })),
      previousStep: () =>
        setState((prev) => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, 1) })),
      reset: () =>
        setState({
          selectedFocus: null,
          selectedSubFocus: null,
          generatedProgram: null,
          currentStep: 1,
          isComplete: false,
        }),
    }),
    []
  );

  return (
    <WorkoutSetupContext.Provider value={{ state, actions }}>
      {children}
    </WorkoutSetupContext.Provider>
  );
};

export const useWorkoutSetupContext = () => {
  const context = useContext(WorkoutSetupContext);
  if (!context) {
    throw new Error('useWorkoutSetupContext must be used within WorkoutSetupProvider');
  }
  return context;
};

