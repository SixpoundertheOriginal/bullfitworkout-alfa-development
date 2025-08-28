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
  };
}