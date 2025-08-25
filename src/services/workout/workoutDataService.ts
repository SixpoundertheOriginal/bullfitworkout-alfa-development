import { updateWorkout, getWorkoutWithExercises, deleteWorkout, bulkDeleteWorkouts, bulkUpdateWorkouts } from '../workoutManagementService';
import { WorkoutUpdateData, WorkoutBulkUpdateData } from './types';

export class WorkoutDataService {
  getWorkout(workoutId: string) {
    return getWorkoutWithExercises(workoutId);
  }

  updateWorkout(workoutId: string, data: WorkoutUpdateData) {
    return updateWorkout(workoutId, data);
  }

  deleteWorkout(workoutId: string) {
    return deleteWorkout(workoutId);
  }

  bulkDelete(workoutIds: string[]) {
    return bulkDeleteWorkouts(workoutIds);
  }

  bulkUpdate(workoutIds: string[], data: WorkoutBulkUpdateData) {
    return bulkUpdateWorkouts(workoutIds, data);
  }
}

export const workoutDataService = new WorkoutDataService();
