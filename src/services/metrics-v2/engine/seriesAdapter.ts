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
  let inRange = 0;
  let withLoad = 0;
  const map = new Map<string, number>();
  const start = opts.start;
  const end = opts.end;

  for (const s of sets) {
    const performedAt = s.performedAt ? new Date(s.performedAt) : undefined;
    if (start && performedAt && performedAt < start) continue;
    if (end && performedAt && performedAt > end) continue;
    inRange++;
    const loadKg = getSetLoadKg(s, ctx);
    const reps = s.reps;
    if (!loadKg || loadKg === 0 || reps == null) continue;
    withLoad++;
    const volumeKg = loadKg * reps;
    const date = (s.performedAt ?? '').split('T')[0];
    if (date) map.set(date, (map.get(date) || 0) + volumeKg);
  }
  const series = Array.from(map.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  console.debug('[v2][audit]', {
    includeBW: includeBodyweight,
    input: sets.length,
    inRange,
    withLoad,
    points: series.length,
  });

  return series;
}
