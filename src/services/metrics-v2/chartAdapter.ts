import type { TimeSeriesPoint, SeriesMap } from './types';

type RawPoint = {
  timestamp?: string;
  ts?: string;
  t?: string;
  time?: string;
  date?: string;
  value?: number | null;
  v?: number | null;
  count?: number | null;
  n?: number | null;
};

const CANONICAL_KEYS = new Set([
  'sets',
  'reps',
  'duration_min',
  'tonnage_kg',
  'density_kg_per_min',
  'avg_rest_sec',
  'set_efficiency_kg_per_min',
]);
const KEY_MAP: Record<string, string> = {
  densityKgPerMin: 'density_kg_per_min',
  density: 'density_kg_per_min',
  density_kg_min: 'density_kg_per_min',
  avgRestSec: 'avg_rest_sec',
  setEfficiencyKgPerMin: 'set_efficiency_kg_per_min',
  set_count: 'sets',
  sets_count: 'sets',
  total_sets: 'sets',
  rep_count: 'reps',
  reps_total: 'reps',
  total_reps: 'reps',
};

export function normalizeTotals(
  totals: Record<string, number | null | undefined>
): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const [k, v] of Object.entries(totals || {})) {
    const canonical = KEY_MAP[k] ?? k.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (CANONICAL_KEYS.has(canonical)) {
      out[canonical] = v as number | null;
    }
  }
  return out;
}

// Mirror camelCase/snake_case keys so consumers can access either form
export function normalizeSeriesKeys(series: SeriesMap): SeriesMap;
export function normalizeSeriesKeys<T>(series: Record<string, T>): Record<string, T>;
export function normalizeSeriesKeys(series: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...series };
  for (const key of Object.keys(series)) {
    const val = series[key as keyof typeof series];
    if (key.includes('_')) {
      const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (!(camel in out)) out[camel] = val;
    } else {
      const snake = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (!(snake in out)) out[snake] = val;
    }
  }
  return out;
}

// Compute element-wise metric from tonnage and duration arrays
export function computePerRow(
  tKg: (number | null)[],
  dMin: (number | null)[]
): (number | null)[] {
  const len = Math.max(tKg.length, dMin.length);
  const result: (number | null)[] = [];
  for (let i = 0; i < len; i++) {
    const t = tKg[i];
    const d = dMin[i];
    result[i] = t != null && d != null && d > 0 ? Math.round((t / d) * 100) / 100 : null;
  }
  return result;
}

function isYYYYMMDD(x: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(x);
}

function toWarsawDate(ts: string): string {
  if (!ts) return '';
  if (isYYYYMMDD(ts)) return ts; // already a day string
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ts));
}

function toCanonicalPoint(p: RawPoint): { t: string; value: number | null } {
  const rawTs = p.timestamp ?? p.ts ?? p.t ?? p.time ?? p.date ?? '';
  const value = p.value ?? p.v ?? p.count ?? p.n ?? null;
  const t = toWarsawDate(rawTs);
  return { t, value };
}

function mapPoints(points: RawPoint[] | undefined): { t: string; value: number | null }[] {
  return (points || []).map(toCanonicalPoint);
}

export type ChartSeriesOutput = {
  series: Record<string, TimeSeriesPoint[]>;
  availableMeasures: string[];
};

// Convert Metrics v2 payload to chart-friendly series keyed by canonical measure ids
export function toChartSeries(
  payload: { series?: Record<string, RawPoint[]> },
  includeDerived = true
): ChartSeriesOutput {
  const inKeys = payload?.series ? Object.keys(payload.series) : [];
  const inSampleKey = inKeys[0];
  const inSampleVal = inSampleKey ? payload!.series![inSampleKey]?.[0] : undefined;
  console.debug('[diag.adapter.in.keys]', inKeys);
  console.debug('[diag.in.sample]', inSampleVal);

  const out: Record<string, TimeSeriesPoint[]> = {};
  const raw = payload.series ?? {};

  // Normalize key names and point shapes first, then filter/round as needed
  const normalizedEntries: Array<[string, { t: string; value: number | null }[]]> = [];
  for (const [k, points] of Object.entries(raw) as [string, RawPoint[]][]) {
    const canonical = KEY_MAP[k] ?? k.replace(/([A-Z])/g, '_$1').toLowerCase();
    normalizedEntries.push([canonical, mapPoints(points)]);
  }

  const normKeys = normalizedEntries.map(([k]) => k);
  const normSample = normalizedEntries[0]?.[1]?.[0];
  console.debug('[diag.adapter.norm.keys]', normKeys);
  console.debug('[diag.norm.sample]', normSample);

  for (const [canonical, points] of normalizedEntries) {
    if (!CANONICAL_KEYS.has(canonical)) continue;
    if (
      !includeDerived &&
      (canonical === 'avg_rest_sec' || canonical === 'set_efficiency_kg_per_min')
    )
      continue;

    const mapped = (points || []).map((p): TimeSeriesPoint => {
      let value = p.value;
      if (
        value !== null &&
        value !== undefined &&
        (canonical === 'duration_min' ||
          canonical === 'tonnage_kg' ||
          canonical === 'density_kg_per_min')
      ) {
        value = Math.round(value * 100) / 100;
      }
      return { date: p.t, value };
    });

    // Keep zero-only arrays; only skip if truly empty
    if (mapped.length >= 0) out[canonical] = mapped;
  }

  if (!out['density_kg_per_min'] && out['tonnage_kg'] && out['duration_min']) {
    const byDate = new Map<string, { tonnage: number | null; duration: number | null }>();
    for (const p of out['tonnage_kg']) byDate.set(p.date, { tonnage: p.value, duration: null });
    for (const p of out['duration_min']) {
      const cur = byDate.get(p.date) || { tonnage: null, duration: null };
      cur.duration = p.value;
      byDate.set(p.date, cur);
    }
    const entries = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b));
    const tKg = entries.map(([, v]) => v.tonnage);
    const dMin = entries.map(([, v]) => v.duration);
    const values = computePerRow(tKg, dMin);
    out['density_kg_per_min'] = entries.map(([date], idx) => ({ date, value: values[idx] }));
  }

  if (
    includeDerived &&
    !out['set_efficiency_kg_per_min'] &&
    out['tonnage_kg'] &&
    out['duration_min']
  ) {
    const byDate = new Map<string, { tonnage: number | null; duration: number | null }>();
    for (const p of out['tonnage_kg']) byDate.set(p.date, { tonnage: p.value, duration: null });
    for (const p of out['duration_min']) {
      const cur = byDate.get(p.date) || { tonnage: null, duration: null };
      cur.duration = p.value;
      byDate.set(p.date, cur);
    }
    const entries = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b));
    const tKg = entries.map(([, v]) => v.tonnage);
    const dMin = entries.map(([, v]) => v.duration);
    const values = computePerRow(tKg, dMin);
    out['set_efficiency_kg_per_min'] = entries.map(([date], idx) => ({ date, value: values[idx] }));
  }
  const availableMeasures = Object.keys(out);
  const aliasOut = normalizeSeriesKeys(out);
  const density = out['density_kg_per_min'];
  console.debug('[diag.adapter.out.density]', {
    has: Boolean(density),
    len: density?.length ?? 0,
    sample: density?.[0],
  });
  const rest = includeDerived ? out['avg_rest_sec'] : undefined;
  const eff = includeDerived ? out['set_efficiency_kg_per_min'] : undefined;
  console.debug('[diag.adapter.out.rest_eff]', {
    rest: { has: Boolean(rest), len: rest?.length ?? 0 },
    eff: { has: Boolean(eff), len: eff?.length ?? 0 },
  });
  console.debug('[diag.adapter.out.keys]', availableMeasures);
  console.debug(
    '[diag.adapter.out.sample]',
    Object.fromEntries(availableMeasures.map(k => [k, out[k][0]]))
  );

  return { series: aliasOut, availableMeasures };
}
