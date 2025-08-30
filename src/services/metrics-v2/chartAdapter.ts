import type { TimeSeriesPoint } from './dto';

const CANONICAL_KEYS = new Set([
  'sets',
  'reps',
  'duration_min',
  'tonnage_kg',
  'density_kg_per_min',
]);
const KEY_MAP: Record<string, string> = {
  densityKgPerMin: 'density_kg_per_min',
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
export function toChartSeries(payload: { series?: Record<string, { timestamp: string; value: number }[]> }): ChartSeriesOutput {
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
      let value = p.value;
      // Apply 2-decimal rounding for duration, tonnage, and density
      if (canonical === 'duration_min' || canonical === 'tonnage_kg' || canonical === 'density_kg_per_min') {
        value = Math.round(value * 100) / 100;
      }
      return { date: toWarsawDate(p.timestamp), value };
    });
    
    if (mapped.length > 0) out[canonical] = mapped;
  }
  
  const availableMeasures = Object.keys(out);
  const density = out['density_kg_per_min'];
  console.debug('[adapter.out.density]', {
    has: Boolean(density),
    len: density?.length ?? 0,
    sample: density?.[0],
  });
  console.debug('[adapter.out]', {
    keys: availableMeasures,
    lengths: Object.fromEntries(availableMeasures.map(k => [k, out[k].length])),
    sample: availableMeasures[0] ? out[availableMeasures[0]][0] : undefined,
  });
  
  return { series: out, availableMeasures };
}
