
import { useMemo } from 'react';
import { useWeightUnit } from "@/context/WeightUnitContext";
import { convertWeight } from "@/utils/unitConversion";
import { ExerciseSet } from '@/types/workout-enhanced';

// Sample exercise history data - in real app this would come from API
const exerciseHistoryData: Record<string, Array<{
  date: string;
  weight: number;
  reps: number;
  sets: number;
  exerciseGroup?: string;
}>> = {
  "Bench Press": [
    { date: "Apr 10", weight: 135, reps: 10, sets: 3, exerciseGroup: "chest" },
    { date: "Apr 3", weight: 130, reps: 10, sets: 3, exerciseGroup: "chest" },
    { date: "Mar 27", weight: 125, reps: 8, sets: 3, exerciseGroup: "chest" },
  ],
  "Squats": [
    { date: "Apr 9", weight: 185, reps: 8, sets: 3, exerciseGroup: "legs" },
    { date: "Apr 2", weight: 175, reps: 8, sets: 3, exerciseGroup: "legs" },
    { date: "Mar 26", weight: 165, reps: 8, sets: 3, exerciseGroup: "legs" },
  ],
  "Deadlift": [
    { date: "Apr 8", weight: 225, reps: 5, sets: 3, exerciseGroup: "back" },
    { date: "Apr 1", weight: 215, reps: 5, sets: 3, exerciseGroup: "back" },
    { date: "Mar 25", weight: 205, reps: 5, sets: 3, exerciseGroup: "back" },
  ],
  "Pull-ups": [
    { date: "Apr 7", weight: 0, reps: 8, sets: 3, exerciseGroup: "back" },
    { date: "Mar 31", weight: 0, reps: 7, sets: 3, exerciseGroup: "back" },
    { date: "Mar 24", weight: 0, reps: 6, sets: 3, exerciseGroup: "back" },
  ],
};

export const useExerciseCard = (exerciseName: string, sets: ExerciseSet[]) => {
  const { weightUnit } = useWeightUnit();

  const previousSession = useMemo(() => {
    const history = exerciseHistoryData[exerciseName] || [];
    if (history.length > 0) {
      return history[0];
    }
    return { date: "N/A", weight: 0, reps: 0, sets: 0, exerciseGroup: "" };
  }, [exerciseName]);

  const olderSession = useMemo(() => {
    const history = exerciseHistoryData[exerciseName] || [];
    return history[1] || previousSession;
  }, [exerciseName, previousSession]);

  const progressData = useMemo(() => {
    const weightDiff = previousSession.weight - olderSession.weight;
    const percentChange = olderSession.weight ? ((weightDiff / olderSession.weight) * 100).toFixed(1) : "0";
    const isImproved = weightDiff > 0;

    return {
      weightDiff,
      percentChange,
      isImproved
    };
  }, [previousSession, olderSession]);

  const currentVolume = useMemo(() => {
    return sets.reduce((total, set) => {
      if (set.completed && set.weight > 0 && set.reps > 0) {
        return total + (set.weight * set.reps);
      }
      return total;
    }, 0);
  }, [sets]);

  const previousVolume = useMemo(() => {
    return previousSession.weight > 0 ? 
      (convertWeight(previousSession.weight, "lb", weightUnit) * previousSession.reps * previousSession.sets) : 0;
  }, [previousSession, weightUnit]);

  const volumeMetrics = useMemo(() => {
    const volumeDiff = currentVolume > 0 && previousVolume > 0 ? (currentVolume - previousVolume) : 0;
    const volumePercentChange = previousVolume > 0 ? ((volumeDiff / previousVolume) * 100).toFixed(1) : "0";
    const hasValidComparison = previousSession.exerciseGroup && previousVolume > 0;

    return {
      volumeDiff,
      volumePercentChange,
      hasValidComparison
    };
  }, [currentVolume, previousVolume, previousSession]);

  return {
    previousSession: {
      ...previousSession,
      weight: convertWeight(previousSession.weight, "lb", weightUnit)
    },
    currentVolume,
    previousVolume,
    volumeMetrics,
    progressData
  };
};
