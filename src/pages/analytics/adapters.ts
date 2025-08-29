/** @deprecated Use server-provided series instead */
import type { PerWorkoutMetrics, TimeSeriesPoint } from '@/services/metrics-v2/dto';
import type { ChartMetric } from './types';

if (process.env.NODE_ENV === 'development') {
  console.warn('Analytics adapters are deprecated; use service series directly');
}

// Helper to extract ISO day from timestamp
const dayKey = (iso: string) => iso.split('T')[0];

// --- Base metrics ---------------------------------------------------------

export function toVolumeSeries(perWorkout: PerWorkoutMetrics[]): TimeSeriesPoint[] {
  const map = new Map<string, number>();
  for (const w of perWorkout) {
    const day = dayKey(w.startedAt);
    map.set(day, (map.get(day) || 0) + (w.totalVolumeKg || 0));
  }
  return Array.from(map.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function toSetsSeries(perWorkout: PerWorkoutMetrics[]): TimeSeriesPoint[] {
  const map = new Map<string, number>();
  for (const w of perWorkout) {
    const day = dayKey(w.startedAt);
    map.set(day, (map.get(day) || 0) + (w.totalSets || 0));
  }
  return Array.from(map.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function toWorkoutsSeries(perWorkout: PerWorkoutMetrics[]): TimeSeriesPoint[] {
  const map = new Map<string, number>();
  for (const w of perWorkout) {
    const day = dayKey(w.startedAt);
    map.set(day, (map.get(day) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function toDurationSeries(perWorkout: PerWorkoutMetrics[]): TimeSeriesPoint[] {
  const map = new Map<string, number>();
  for (const w of perWorkout) {
    const day = dayKey(w.startedAt);
    map.set(day, (map.get(day) || 0) + (w.durationMin || 0));
  }
  return Array.from(map.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function toRepsSeries(perWorkout: PerWorkoutMetrics[]): TimeSeriesPoint[] {
  const map = new Map<string, number>();
  for (const w of perWorkout) {
    const day = dayKey(w.startedAt);
    map.set(day, (map.get(day) || 0) + (w.totalReps || 0));
  }
  return Array.from(map.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Compute daily density series using weighted average of tonnage and duration
 */
export function toDensitySeriesWeighted(perWorkout: PerWorkoutMetrics[]): TimeSeriesPoint[] {
  const map = new Map<string, { tonnage: number; duration: number }>();
  for (const w of perWorkout) {
    const day = dayKey(w.startedAt);
    const cur = map.get(day) || { tonnage: 0, duration: 0 };
    cur.tonnage += w.totalVolumeKg || 0;
    cur.duration += w.durationMin || 0;
    map.set(day, cur);
  }
  return Array.from(map.entries())
    .map(([date, { tonnage, duration }]) => ({
      date,
      value: +(duration > 0 ? tonnage / duration : 0).toFixed(2),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Average rest per day weighted by set count
 */
export function toAvgRestSeries(perWorkout: PerWorkoutMetrics[]): TimeSeriesPoint[] {
  const map = new Map<string, { restSec: number; sets: number }>();
  for (const w of perWorkout) {
    const day = dayKey(w.startedAt);
    const cur = map.get(day) || { restSec: 0, sets: 0 };
    const restSec = (w.restMin || 0) * 60;
    cur.restSec += restSec;
    cur.sets += w.totalSets || 0;
    map.set(day, cur);
  }
  return Array.from(map.entries())
    .map(([date, { restSec, sets }]) => ({
      date,
      value: +(restSec / Math.max(sets, 1)).toFixed(2),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Average set efficiency per day ignoring null values
 */
export function toEfficiencySeries(perWorkout: PerWorkoutMetrics[]): TimeSeriesPoint[] {
  const map = new Map<string, { sum: number; count: number }>();
  for (const w of perWorkout) {
    const day = dayKey(w.startedAt);
    const cur = map.get(day) || { sum: 0, count: 0 };
    const eff = w.kpis?.setEfficiency;
    if (eff !== null && eff !== undefined) {
      cur.sum += eff;
      cur.count += 1;
    }
    map.set(day, cur);
  }
  return Array.from(map.entries())
    .map(([date, { sum, count }]) => ({
      date,
      value: count > 0 ? +(sum / count).toFixed(2) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// --- Metric Adapter Map ---------------------------------------------------

export const metricToSeries: Record<ChartMetric, (data: PerWorkoutMetrics[]) => TimeSeriesPoint[]> = {
  volume: toVolumeSeries,
  sets: toSetsSeries,
  workouts: toWorkoutsSeries,
  duration: toDurationSeries,
  reps: toRepsSeries,
  density: toDensitySeriesWeighted,
  avgRest: toAvgRestSeries,
  setEfficiency: toEfficiencySeries,
};
