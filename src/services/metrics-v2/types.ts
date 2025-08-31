// Canonical types for metrics repository
export type SeriesMap = Record<string, number[] | (number | null)[]>;
export interface TimeSeriesPoint { date: string; value: number | null; }

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
  failurePoint?: 'none'|'technical'|'muscular' | null;
  formScore?: number | null;
  restTimeSec?: number;
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
