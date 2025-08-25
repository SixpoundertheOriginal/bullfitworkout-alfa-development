
import { useState, useEffect } from 'react';
import { Exercise, ExerciseSet, WeightCalculation } from '@/types/exercise';

interface UseExerciseWeightProps {
  exercise: Exercise;
  userWeight?: number; // in kg
  defaultWeight?: number;
}

export const useExerciseWeight = ({ 
  exercise, 
  userWeight = 70, // Default user weight if not provided
  defaultWeight = 0 
}: UseExerciseWeightProps) => {
  const getInitialWeight = (): WeightCalculation => {
    if (!exercise) return { value: defaultWeight, isAuto: false, source: 'default' };

    const isBodyweight =
      exercise.is_bodyweight || exercise.equipment_type.includes('bodyweight');
    const loadFactor = exercise.bw_multiplier ?? 1.0;

    if (isBodyweight && userWeight) {
      return {
        value: Math.round(userWeight * loadFactor * 10) / 10,
        isAuto: true,
        source: 'auto'
      };
    }

    return {
      value: defaultWeight,
      isAuto: false,
      source: 'default'
    };
  };

  const [weightCalc, setWeightCalc] = useState<WeightCalculation>(getInitialWeight());

  useEffect(() => {
    if (weightCalc.source === 'default') {
      setWeightCalc(getInitialWeight());
    }
  }, [exercise, userWeight]);

  const updateWeight = (newWeight: number) => {
    setWeightCalc({
      value: newWeight,
      isAuto: false,
      source: 'user'
    });
  };

  const resetToAuto = () => {
    setWeightCalc(getInitialWeight());
  };

  return {
    weight: weightCalc.value,
    isAutoWeight: weightCalc.isAuto,
    weightSource: weightCalc.source,
    updateWeight,
    resetToAuto
  };
};
