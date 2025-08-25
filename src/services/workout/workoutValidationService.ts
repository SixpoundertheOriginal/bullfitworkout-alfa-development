import { TimingValidator, TimingReport } from '@/utils/timingValidation';

export class WorkoutValidationService {
  validateTiming(params: Parameters<typeof TimingValidator.validateWorkoutTiming>[0]): TimingReport {
    return TimingValidator.validateWorkoutTiming(params);
  }
}

export const workoutValidationService = new WorkoutValidationService();
