import type { TimeSeriesPoint } from './dto';

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
export function toChartSeries(payload: { series?: Record<string, { timestamp?: string; ts?: string; value: number | null }[]> }): ChartSeriesOutput {
  console.debug('[adapter.in]', {
    hasSeries: Boolean(payload?.series),
    seriesKeys: payload?.series ? Object.keys(payload.series) : [],
    rawKeys: Object.keys(payload || {}),
  });
  const out: Record<string, TimeSeriesPoint[]> = {};
  const raw = payload.series ?? {};
  
  for (const [k, points] of Object.entries(raw)) {
    const canonical = KEY_MAP[k] ?? k.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (!CANONICAL_KEYS.has(canonical)) continue;
    
    const mapped = (points || []).map(p => {
      const ts = (p as any).timestamp ?? (p as any).ts;
      let value = p.value as number | null;
      if (value !== null && value !== undefined && (canonical === 'duration_min' || canonical === 'tonnage_kg' || canonical === 'density_kg_per_min')) {
        value = Math.round(value * 100) / 100;
      }
      return { date: toWarsawDate(ts), value } as any;
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
    out['density_kg_per_min'] = Array.from(byDate.entries())
      .map(([date, { tonnage, duration }]) => ({
        date,
        value: duration && duration > 0 && tonnage !== null ? +(tonnage / duration).toFixed(2) : null,
      }));
  }

  const aliasOut: Record<string, TimeSeriesPoint[]> = { ...out } as any;
  for (const k of Object.keys(out)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    aliasOut[camel] = out[k];
  }

  const availableMeasures = Object.keys(out);
  const density = out['density_kg_per_min'];
  console.debug('[adapter.out.density]', {
    has: Boolean(density),
    len: density?.length ?? 0,
    sample: density?.[0],
  });
  const rest = out['avg_rest_sec'];
  const eff = out['set_efficiency_kg_per_min'];
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
