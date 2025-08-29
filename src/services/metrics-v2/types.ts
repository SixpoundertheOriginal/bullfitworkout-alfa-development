// Canonical types for metrics repository
export interface DateRange {
  start: string;
  end: string;
}

export interface WorkoutRaw {
  id: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
}

export interface SetRaw {
  id: string;
  workoutId: string;
  weightKg: number;
  reps: number;
  exerciseId: string;
  exerciseName?: string;
}

export interface MetricsRepository {
  getWorkouts(range: DateRange, userId: string): Promise<WorkoutRaw[]>;
  getSets(workoutIds: string[], userId: string, exerciseId?: string): Promise<SetRaw[]>;
}

// In-memory implementation for development/testing
export class InMemoryMetricsRepository implements MetricsRepository {
  async getWorkouts(): Promise<WorkoutRaw[]> {
    return []
  }

  async getSets(_workoutIds: string[] = [], _userId: string = '', _exerciseId?: string): Promise<SetRaw[]> {
    return []
  }
}
