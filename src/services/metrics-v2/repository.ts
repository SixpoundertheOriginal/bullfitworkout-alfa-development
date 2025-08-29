// Repository interface (DI). Implementations will use Supabase/BigQuery later.
export type DateRange = { from: Date; to: Date };

export interface MetricsRepository {
  getWorkouts(
    range: DateRange,
    userId: string
  ): Promise<{ id: string; startedAt: string }[]>;
  getSets(
    workoutIds: string[],
    exerciseId?: string
  ): Promise<{
    workoutId: string;
    exerciseName: string;
    weightKg?: number;
    reps?: number;
    seconds?: number;
    isBodyweight?: boolean;
  }[]>;
}

export const InMemoryRepoStub: MetricsRepository = {
  async getWorkouts() {
    return [];
  },
  async getSets() {
    return [];
  },
};
