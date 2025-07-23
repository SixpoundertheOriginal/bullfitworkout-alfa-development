import { useState } from 'react';
import { ExerciseVariant, ExerciseRecommendation, VariantSelectionData } from '@/types/exercise-variants';
import { useRealExerciseStats } from './useRealExerciseStats';
import { usePersonalRecords } from './usePersonalRecords';

export const useExerciseVariants = (exerciseName?: string) => {
  const [selectedVariant, setSelectedVariant] = useState<VariantSelectionData | null>(null);
  
  // Use real data hooks
  const { exerciseStats, isLoading: statsLoading } = useRealExerciseStats(exerciseName);
  const { recentRecords } = usePersonalRecords();

  // For now, return empty variants and recommendations since we don't have the variants table yet
  const variants: ExerciseVariant[] = [];
  const recommendations: ExerciseRecommendation[] = [];

  const selectVariant = (variantData: VariantSelectionData) => {
    setSelectedVariant(variantData);
  };

  const clearSelection = () => {
    setSelectedVariant(null);
  };

  const getProgressionTrend = (exerciseName: string) => {
    return exerciseStats?.progressionTrend || 'stable';
  };

  const getLastPerformed = (exerciseName: string) => {
    return exerciseStats?.lastPerformed || null;
  };

  const getPersonalBest = (exerciseName: string) => {
    return exerciseStats?.personalBest || null;
  };

  return {
    variants,
    recommendations,
    selectedVariant,
    selectVariant,
    clearSelection,
    getProgressionTrend,
    getLastPerformed,
    getPersonalBest,
    isLoading: statsLoading,
  };
};