// Analytics types for the Analytics page
export interface AnalyticsData {
  totals: {
    totalVolumeKg: number;
    totalSets: number;
    totalReps: number;
    workouts: number;
    durationMin: number;
  };
  series: {
    volume: Array<{
      date: string;
      value: number;
    }>;
    sets?: Array<{ date: string; value: number }>;
    reps?: Array<{ date: string; value: number }>;
    duration?: Array<{ date: string; value: number }>;
    workouts?: Array<{ date: string; value: number }>;
  };
}
