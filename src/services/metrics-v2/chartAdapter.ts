// Adapter from domain series -> chart component shape
import { TimeSeriesPoint } from './dto';

export function toChartSeries(
  series: TimeSeriesPoint[],
  keys: { xKey: 'date'; yKey: 'value' } = { xKey: 'date', yKey: 'value' }
) {
  const labels: string[] = series.map(p => p.date);
  const datasets: number[] = series.map(p => p.value);
  return { labels, datasets };
}
