// Canonical, versioned DTOs for Metrics Service v2 (units: kg, min; dates: ISO YYYY-MM-DD)
export type TimeSeriesPoint = { date: string; value: number };

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

export type ServiceOutput = {
  totals: Totals;
  perWorkout: PerWorkoutMetrics[];
  prs: PersonalRecord[];
  series: {
    volume: TimeSeriesPoint[];
    sets: TimeSeriesPoint[];
    reps: TimeSeriesPoint[];
    density: TimeSeriesPoint[];
    cvr: TimeSeriesPoint[]; // rule later: if views=0 => 0
  };
  totalsKpis?: TotalsKpis;
  meta: {
    generatedAt: string;
    version: 'v2';
    inputs: { tz: 'Europe/Warsaw'; units: 'kg|min' };
    BW_ASSUMED?: boolean;
  };
};
