// Canonical, versioned DTOs for Metrics Service v2 (units: kg, min; dates: ISO YYYY-MM-DD)
export type TimeSeriesPoint = { date: string; value: number };

export type DayAgg = {
  date: string;
  volumeKg: number;
  sets: number;
  reps: number;
  durationMin: number;
  restSec: number;
  workouts: number;
};

export type DayDerived = {
  date: string;
  densityKgPerMin: number;
  avgRestSec: number;
  setEfficiency: number | null;
};

export const METRIC_KEYS = [
  'volume',
  'sets',
  'workouts',
  'duration',
  'reps',
  'density',
  'avgRest',
  'setEfficiency',
] as const;

export type MetricKey = typeof METRIC_KEYS[number];

export type PerWorkoutKpis = {
  densityKgPerMin: number;
  avgRestSec: number;           // raw seconds for precision
  setEfficiency: number | null; // ratio or null if no target
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
  densityKgPerMin: number; // overall tonnage/overall duration
  avgRestSec: number;      // weighted by sets
  setEfficiency: number | null;
};

export type Totals = {
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  workouts: number;
  durationMin: number;
};

export type PersonalRecord = {
  id: string;
  exerciseName: string;
  type: '1RM' | '5RM' | 'VolumeSession' | 'BestSet';
  value: number;
  unit: 'kg' | 'reps' | 'kg·s';
  date: string; // ISO day (YYYY-MM-DD)
};

export interface ServiceOutputV2 {
  totals: Totals;
  perWorkout: PerWorkoutMetrics[];
  prs: PersonalRecord[];
  series: {
    base: DayAgg[];
    derived: DayDerived[];
  };
  totalsKpis?: TotalsKpis;
  meta: {
    generatedAt: string;
    version: 'v2';
    inputs: { tz: 'Europe/Warsaw'; units: 'kg|min' };
    BW_ASSUMED?: boolean;
  };
  metricKeys: MetricKey[];
}

export type ServiceOutput = ServiceOutputV2;
