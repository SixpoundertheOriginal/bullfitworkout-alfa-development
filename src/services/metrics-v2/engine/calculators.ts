// Metrics v2 engine calculators and helpers
import { TimeSeriesPoint } from '../dto';

// Simple unit converter
function convertToKg(weight?: number, unit: string = 'kg'): number {
  if (!weight || isNaN(weight)) return 0;
  return unit === 'lb' ? weight * 0.453592 : weight;
}

// Load factor lookup for bodyweight movements
function loadFactor(_exerciseId?: string): number {
  // Placeholder - would normally look up per exercise
  return 1;
}

export interface LoadCtx {
  includeBodyweight: boolean;
  bodyweightKg: number;
}

export interface SetLike {
  weight?: number | null;
  unit?: string;
  reps?: number | null;
  isBodyweight?: boolean;
  exerciseId?: string;
  performedAt?: string; // ISO timestamp
  workMs?: number;
}

export function getSetLoadKg(set: SetLike, ctx: LoadCtx): number {
  const base = convertToKg(set.weight ?? undefined, set.unit) || 0;
  const bw = ctx.includeBodyweight && set.isBodyweight
    ? ctx.bodyweightKg * loadFactor(set.exerciseId)
    : 0;
  return base + bw;
}

export function getSetVolumeKg(set: SetLike, ctx: LoadCtx): number {
  const loadKg = getSetLoadKg(set, ctx);
  return loadKg * (set.reps ?? 0);
}

export function deriveRestMs(setsInWorkout: SetLike[]): number[] {
  const rests: number[] = [];
  const ordered = [...setsInWorkout].sort((a, b) => {
    const ta = new Date(a.performedAt ?? 0).getTime();
    const tb = new Date(b.performedAt ?? 0).getTime();
    return ta - tb;
  });
  for (let i = 0; i < ordered.length - 1; i++) {
    const cur = new Date(ordered[i].performedAt ?? 0).getTime();
    const next = new Date(ordered[i + 1].performedAt ?? 0).getTime();
    const diff = next - cur;
    if (!isNaN(diff) && diff >= 0) rests.push(diff);
  }
  return rests;
}

export interface DayContext {
  sets: SetLike[];
  activeMinutes: number; // minutes of work (duration - rest)
  restMs?: number[]; // optional precomputed rest durations
  workMsTotal?: number; // optional precomputed work time
}

export interface CalcResult {
  totals: Record<string, number>;
  series: Record<string, TimeSeriesPoint[]>;
}

export function calcDensityKgPerMin(
  ctxByDay: Record<string, DayContext>,
  loadCtx: LoadCtx
): CalcResult {
  const series: TimeSeriesPoint[] = [];
  let totalVolume = 0;
  let totalActive = 0;
  for (const day of Object.keys(ctxByDay).sort()) {
    const ctx = ctxByDay[day];
    const vol = ctx.sets.reduce((s, set) => s + getSetVolumeKg(set, loadCtx), 0);
    const density = vol / Math.max(1, ctx.activeMinutes);
    series.push({ date: day, value: +density.toFixed(2) });
    totalVolume += vol;
    totalActive += ctx.activeMinutes;
  }
  const totalDensity = totalVolume / Math.max(1, totalActive);
  return {
    totals: { density_kg_min: +totalDensity.toFixed(2) },
    series: { density_kg_min: series },
  };
}

export function calcAvgRestMs(
  ctxByDay: Record<string, DayContext>
): CalcResult {
  const series: TimeSeriesPoint[] = [];
  let sum = 0;
  let count = 0;
  for (const day of Object.keys(ctxByDay).sort()) {
    const ctx = ctxByDay[day];
    const rests = ctx.restMs ?? deriveRestMs(ctx.sets);
    const avg = rests.length ? rests.reduce((a, b) => a + b, 0) / rests.length : 0;
    series.push({ date: day, value: Math.floor(avg) });
    sum += avg * rests.length;
    count += rests.length;
  }
  const total = count ? Math.floor(sum / count) : 0;
  return {
    totals: { avg_rest_ms: total },
    series: { avg_rest_ms: series },
  };
}

export function calcSetEfficiencyPct(
  ctxByDay: Record<string, DayContext>
): CalcResult {
  const series: TimeSeriesPoint[] = [];
  let totalWork = 0;
  let totalRest = 0;
  for (const day of Object.keys(ctxByDay).sort()) {
    const ctx = ctxByDay[day];
    const rests = ctx.restMs ?? deriveRestMs(ctx.sets);
    const restTotal = rests.reduce((a, b) => a + b, 0);
    const workMs = ctx.workMsTotal ?? ctx.sets.reduce((s, set) => s + (set.workMs ?? (set.reps ?? 0) * 1000), 0);
    const pct = workMs + restTotal > 0 ? (100 * workMs) / (workMs + restTotal) : 0;
    series.push({ date: day, value: +pct.toFixed(2) });
    totalWork += workMs;
    totalRest += restTotal;
  }
  const totalPct = totalWork + totalRest > 0 ? (100 * totalWork) / (totalWork + totalRest) : 0;
  return {
    totals: { set_efficiency_pct: +totalPct.toFixed(2) },
    series: { set_efficiency_pct: series },
  };
}
