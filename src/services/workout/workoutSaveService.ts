import { saveWorkout, processRetryQueue, recoverPartiallyCompletedWorkout, attemptImmediateRecovery } from '../workoutSaveService';
import { SaveWorkoutParams, SaveResult } from './types';

export class WorkoutSaveService {
  save(params: SaveWorkoutParams): Promise<SaveResult> {
    return saveWorkout(params);
  }

  processQueue(userId: string) {
    return processRetryQueue(userId);
  }

  recover(workoutId: string) {
    return recoverPartiallyCompletedWorkout(workoutId);
  }

  attemptImmediateRecovery(workoutId: string) {
    return attemptImmediateRecovery(workoutId);
  }
}

export const workoutSaveService = new WorkoutSaveService();
