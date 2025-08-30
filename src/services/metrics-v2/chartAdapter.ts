import type { TimeSeriesPoint } from './dto';

const CANONICAL_KEYS = new Set([
  'sets',
  'reps',
  'duration_min',
  'tonnage_kg',
  'density_kg_per_min',
]);

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
  const out: Record<string, TimeSeriesPoint[]> = {};
  const raw = payload.series ?? {};
  for (const [k, points] of Object.entries(raw)) {
    const canonical = k.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (!CANONICAL_KEYS.has(canonical)) continue;
    const mapped = (points || []).map(p => ({ date: toWarsawDate(p.timestamp), value: p.value }));
    if (mapped.length > 0) out[canonical] = mapped;
  }
  const availableMeasures = Object.keys(out);
  console.debug('[adapter.out]', {
    keys: availableMeasures,
    lengths: Object.fromEntries(availableMeasures.map(k => [k, out[k].length])),
    sample: availableMeasures[0] ? out[availableMeasures[0]][0] : undefined,
  });
  return { series: out, availableMeasures };
}
