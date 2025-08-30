// Canonical, versioned DTOs for Metrics Service v2 (units: kg, min; dates: ISO YYYY-MM-DD)
export type TimeSeriesPoint = { date: string; value: number };

export type PerWorkoutKpis = {
  density: number; // kg/min
  avgRestSec: number; // seconds
  setEfficiencyKgPerMin: number | null; // kg/min or null if no rest data
};

export type PerWorkoutMetrics = {
  workoutId: string;
  startedAt: string;           // ISO timestamp
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  durationMin: number;
  activeMin?: number;
  restMin?: number;
  kpis?: PerWorkoutKpis;
};

export type TotalsKpis = {
  density: number; // kg/min
  avgRestSec: number; // seconds
  setEfficiencyKgPerMin: number | null; // kg/min
};

export type Totals = {
  tonnage_kg: number;
  sets_count: number;
  reps_total: number;
  workouts: number;
  duration_min: number;
  density_kg_min?: number;
  avgRestSec?: number;
  setEfficiencyKgPerMin?: number;
};

export type PersonalRecord = {
  id: string;
  exerciseName: string;
  type: '1RM' | '5RM' | 'VolumeSession' | 'BestSet';
  value: number;
  unit: 'kg' | 'reps' | 'kg·s';
  date: string; // ISO day (YYYY-MM-DD)
};

export type ServiceOutput = {
  totals: Totals;
  perWorkout: PerWorkoutMetrics[];
  prs: PersonalRecord[];
  series: Record<string, TimeSeriesPoint[]>;
  metricKeys: string[];
  totalsKpis?: TotalsKpis;
  timePeriodAverages?: import('./calculators/timePeriodAveragesCalculator').TimePeriodAveragesOutput;
  meta: {
    generatedAt: string;
    version: 'v2';
    inputs: { tz: 'Europe/Warsaw'; units: 'kg|min' };
    BW_ASSUMED?: boolean;
  };
};
