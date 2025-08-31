// Metrics v2 engine calculators and helpers
import { TimeSeriesPoint } from '../types';

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

const EPSILON = 1e-9;
const clampSec = (s: number): number => {
  if (!isFinite(s)) return 0;
  return Math.max(0, Math.min(s, 600));
};

export function restCoveragePct(ctxByDay: Record<string, DayContext>): number {
  let explicit = 0;
  let possible = 0;
  for (const ctx of Object.values(ctxByDay)) {
    const potential = ctx.sets.length > 1 ? ctx.sets.length - 1 : 0;
    possible += potential;
    explicit += ctx.restMs?.length ?? 0;
  }
  return possible > 0 ? +(100 * explicit / possible).toFixed(2) : 0;
}

// Future path when per-set seconds are reliable
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
    const minutes = ctx.activeMinutes;
    const density = minutes > 0 ? vol / minutes : 0;
    series.push({ date: day, value: +density.toFixed(2) });
    totalVolume += vol;
    totalActive += minutes;
  }
  const totalDensity = totalActive > 0 ? totalVolume / totalActive : 0;
  return {
    totals: { density_kg_per_min: +totalDensity.toFixed(2) },
    series: { density_kg_per_min: series },
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

export function calcAvgRestSec(
  ctxByDay: Record<string, DayContext>
): CalcResult {
  const series: TimeSeriesPoint[] = [];
  let sum = 0;
  let count = 0;
  for (const day of Object.keys(ctxByDay).sort()) {
    const ctx = ctxByDay[day];
    const secs = (ctx.restMs ?? []).map(ms => clampSec(ms / 1000));
    const avg = secs.length ? secs.reduce((a, b) => a + b, 0) / secs.length : 0;
    series.push({ date: day, value: +avg.toFixed(2) });
    sum += secs.reduce((a, b) => a + b, 0);
    count += secs.length;
  }
  const total = count ? sum / count : 0;
  return {
    totals: { avgRestSec: +total.toFixed(2) },
    series: { avgRestSec: series },
  };
}

export function calcSetEfficiencyKgPerMin(
  ctxByDay: Record<string, DayContext>,
  loadCtx: LoadCtx
): CalcResult {
  const series: TimeSeriesPoint[] = [];
  let totalVol = 0;
  let totalMin = 0;
  for (const day of Object.keys(ctxByDay).sort()) {
    const ctx = ctxByDay[day];
    const vol = ctx.sets.reduce((s, set) => s + getSetVolumeKg(set, loadCtx), 0);
    const restSec = (ctx.restMs ?? []).reduce((s, ms) => s + clampSec(ms / 1000), 0);
    const workSec = (ctx.workMsTotal ?? ctx.sets.reduce((s, set) => s + (set.workMs ?? (set.reps ?? 0) * 1000), 0)) / 1000;
    const minutes = (restSec + workSec) / 60;
    const eff = minutes > EPSILON ? vol / minutes : 0;
    const val = Math.max(0, eff);
    series.push({ date: day, value: +val.toFixed(2) });
    totalVol += vol;
    totalMin += minutes;
  }
  const totalEff = totalMin > EPSILON ? totalVol / totalMin : 0;
  console.debug('[v2.audit.rest_efficiency]', { coveragePct: restCoveragePct(ctxByDay) });
  return {
    totals: { setEfficiencyKgPerMin: +Math.max(0, totalEff).toFixed(2) },
    series: { setEfficiencyKgPerMin: series },
  };
}
