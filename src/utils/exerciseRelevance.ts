import type { Exercise } from '@/types/exercise';

interface ExerciseRelevanceScore {
  exercise: Exercise;
  relevanceScore: number;
  matchedCriteria: string[];
  isRecommended: boolean;
}

const FOCUS_MUSCLE_MAPPING: Record<string, string[]> = {
  Push: ['chest', 'triceps', 'shoulders'],
  Pull: ['back', 'biceps'],
  Legs: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
};

export const calculateExerciseRelevance = (
  exercise: Exercise,
  selectedFocus: string,
  selectedSubFocus?: string
): ExerciseRelevanceScore => {
  let score = 0;
  const matchedCriteria: string[] = [];

  const focusMuscleGroups = FOCUS_MUSCLE_MAPPING[selectedFocus] || [];
  const muscleMatch = exercise.primary_muscle_groups?.some((m) =>
    focusMuscleGroups.includes(m)
  );
  if (muscleMatch) {
    score += 100;
    matchedCriteria.push('Primary muscle match');
  }

  const secondaryMatch = exercise.secondary_muscle_groups?.some((m) =>
    focusMuscleGroups.includes(m)
  );
  if (secondaryMatch) {
    score += 50;
    matchedCriteria.push('Secondary muscle match');
  }

  if (selectedSubFocus) {
    const subMatch = exercise.tags?.includes(selectedSubFocus.toLowerCase());
    if (subMatch) {
      score += 75;
      matchedCriteria.push('Sub-focus match');
    }
  }

  return {
    exercise,
    relevanceScore: score,
    matchedCriteria,
    isRecommended: score >= 100,
  };
};

export type { ExerciseRelevanceScore };
