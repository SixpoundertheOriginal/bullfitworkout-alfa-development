import { processWorkoutMetrics } from '@/utils/workoutMetricsProcessor';
import { ExerciseSet } from '@/types/exercise';

export class WorkoutCalculationService {
  processMetrics(
    exercises: Record<string, ExerciseSet[]>,
    duration: number,
    weightUnit: 'kg' | 'lb' = 'kg',
    userBodyInfo?: { weight: number; unit: string },
    workoutTiming?: { start_time?: string; duration: number }
  ) {
    return processWorkoutMetrics(exercises, duration, weightUnit, userBodyInfo, workoutTiming);
  }
}

export const workoutCalculationService = new WorkoutCalculationService();
