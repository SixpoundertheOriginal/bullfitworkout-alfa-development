import { getSetLoadKg } from './calculators';
import type { SetLike, LoadCtx } from './calculators';
import { TimeSeriesPoint } from '../dto';

export interface SeriesAdapterOpts extends LoadCtx {
  start?: Date;
  end?: Date;
  includeBodyweightLoads?: boolean; // alias
}

export function toVolumeSeries(
  sets: SetLike[],
  opts: SeriesAdapterOpts
): TimeSeriesPoint[] {
  const includeBodyweight = opts.includeBodyweightLoads ?? opts.includeBodyweight;
  const ctx: LoadCtx = { includeBodyweight, bodyweightKg: opts.bodyweightKg };
  let withLoad = 0;
  let bwDerived = 0;
  const map = new Map<string, number>();

  for (const s of sets) {
    const load = getSetLoadKg(s, ctx);
    if (load > 0) {
      withLoad++;
      if (includeBodyweight && s.isBodyweight) bwDerived++;
      const vol = load * (s.reps ?? 0);
      const date = (s.performedAt ?? '').split('T')[0];
      if (date) map.set(date, (map.get(date) || 0) + vol);
    }
  }
  const series = Array.from(map.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  console.debug(
    `[v2][audit] inputSets:${sets.length} inRange:${sets.length} withLoad>0:${withLoad} bwDerived:${bwDerived} points:${series.length}`
  );

  return series;
}
