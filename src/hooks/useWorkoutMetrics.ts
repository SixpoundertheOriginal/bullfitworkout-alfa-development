
import { useState, useEffect } from 'react';
import { ExerciseSet } from '@/types/exercise';
import { WorkoutMetrics } from '@/types/workout-metrics';
import { 
  calculateWorkoutMetrics, 
  getExerciseGroup, 
  calculateSetVolume,
  isIsometricExercise,
  isBodyweightExercise 
} from '@/utils/exerciseUtils';

export interface ExerciseGroupData {
  group: string;
  totalVolume: number;
  exercises: string[];
}

export interface UserBodyInfo {
  weight: number;
  unit: string;
}

export const useWorkoutMetrics = (
  exercises: Record<string, ExerciseSet[]>,
  time: number,
  weightUnit: string,
  userBodyInfo?: UserBodyInfo
) => {
  const [metrics, setMetrics] = useState<WorkoutMetrics>({
    time: 0,
    exerciseCount: 0,
    completedSets: 0,
    totalSets: 0,
    performance: {
      volume: 0,
      intensity: 0,
      density: 0,
      efficiency: 0
    }
  });
  
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroupData[]>([]);
  const [exerciseTypeCounts, setExerciseTypeCounts] = useState({
    weighted: 0,
    bodyweight: 0,
    isometric: 0,
    total: 0
  });

  useEffect(() => {
    if (!exercises || Object.keys(exercises).length === 0) {
      // Return early with default values if no exercises
      return;
    }

    // Get user bodyweight (with default fallback of 70kg)
    const userBodyweight = userBodyInfo?.weight || 70;
    
    // Convert user weight to kg if needed
    const userWeightInKg = userBodyInfo?.unit === 'lb' 
      ? userBodyweight / 2.20462 
      : userBodyweight;

    // Calculate standard metrics
    const updatedMetrics = calculateWorkoutMetrics(exercises, time, weightUnit, userWeightInKg);
    setMetrics(updatedMetrics);
    
    // Calculate exercise groups data
    const groupsMap: Record<string, ExerciseGroupData> = {};
    
    // Track exercise types for analytics
    let weightedCount = 0;
    let bodyweightCount = 0;
    let isometricCount = 0;
    
    Object.entries(exercises).forEach(([exerciseName, sets]) => {
      const group = getExerciseGroup(exerciseName);
      if (!group) return;
      
      if (!groupsMap[group]) {
        groupsMap[group] = {
          group,
          totalVolume: 0,
          exercises: []
        };
      }
      
      // Add exercise to group
      if (!groupsMap[group].exercises.includes(exerciseName)) {
        groupsMap[group].exercises.push(exerciseName);
      }
      
      // Track exercise type
      if (isIsometricExercise(exerciseName)) {
        isometricCount++;
      } else if (isBodyweightExercise(exerciseName)) {
        bodyweightCount++;
      } else {
        weightedCount++;
      }
      
      // Calculate volume for this exercise using our enhanced volume calculation
      let exerciseVolume = 0;
      sets.forEach(set => {
        if (set.completed) {
          exerciseVolume += calculateSetVolume(set, exerciseName, userWeightInKg);
        }
      });
      
      groupsMap[group].totalVolume += exerciseVolume;
    });
    
    // Update exercise type counts
    setExerciseTypeCounts({
      weighted: weightedCount,
      bodyweight: bodyweightCount,
      isometric: isometricCount,
      total: weightedCount + bodyweightCount + isometricCount
    });
    
    // Convert map to array
    setExerciseGroups(Object.values(groupsMap));
  }, [exercises, time, weightUnit, userBodyInfo]);

  return { 
    metrics, 
    exerciseGroups,
    exerciseCount: metrics.exerciseCount,
    completedSets: metrics.completedSets,
    totalSets: metrics.totalSets,
    performance: metrics.performance,
    exerciseTypeCounts
  };
};
