import type { TimeSeriesPoint, SeriesMap } from './types';

type RawPoint = { timestamp?: string; ts?: string; value: number | null };

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
};

// Mirror camelCase/snake_case keys so consumers can access either form
export function normalizeSeriesKeys(series: SeriesMap): SeriesMap;
export function normalizeSeriesKeys<T>(series: Record<string, T>): Record<string, T>;
export function normalizeSeriesKeys(series: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...series };
  for (const key of Object.keys(series)) {
    if (key.includes('_')) {
      const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (!(camel in out)) out[camel] = series[key];
    } else {
      const snake = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (!(snake in out)) out[snake] = series[key];
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

function toWarsawDate(ts: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ts));
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
  console.debug('[adapter.in]', {
    hasSeries: Boolean(payload?.series),
    seriesKeys: payload?.series ? Object.keys(payload.series) : [],
    rawKeys: Object.keys(payload || {}),
  });
  const out: Record<string, TimeSeriesPoint[]> = {};
  const raw = payload.series ?? {};

  for (const [k, points] of Object.entries(raw) as [string, RawPoint[]][]) {
    const canonical = KEY_MAP[k] ?? k.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (!CANONICAL_KEYS.has(canonical)) continue;
    if (
      !includeDerived &&
      (canonical === 'avg_rest_sec' || canonical === 'set_efficiency_kg_per_min')
    )
      continue;
    
    const mapped = (points || []).map((p): TimeSeriesPoint => {
      const ts = p.timestamp ?? p.ts ?? '';
      let value = p.value;
      if (value !== null && value !== undefined && (canonical === 'duration_min' || canonical === 'tonnage_kg' || canonical === 'density_kg_per_min')) {
        value = Math.round(value * 100) / 100;
      }
      return { date: toWarsawDate(ts), value };
    });
    
    if (mapped.length > 0) out[canonical] = mapped;
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
  console.debug('[adapter.out.density]', {
    has: Boolean(density),
    len: density?.length ?? 0,
    sample: density?.[0],
  });
  const rest = includeDerived ? out['avg_rest_sec'] : undefined;
  const eff = includeDerived ? out['set_efficiency_kg_per_min'] : undefined;
  console.debug('[adapter.out.rest_eff]', {
    rest: { has: Boolean(rest), len: rest?.length ?? 0 },
    eff: { has: Boolean(eff), len: eff?.length ?? 0 },
  });
  console.debug('[adapter.out]', {
    keys: availableMeasures,
    lengths: Object.fromEntries(availableMeasures.map(k => [k, out[k].length])),
    sample: availableMeasures[0] ? out[availableMeasures[0]][0] : undefined,
  });

  return { series: aliasOut, availableMeasures };
}
