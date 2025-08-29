import React from 'react';
import type { ServiceOutput, MetricKey } from '@/services/metrics-v2/dto';
import { fmtKgPerMin, fmtSeconds, fmtRatio } from './formatters';
import { useConfig } from '@/config/runtimeConfig';
import MetricSelector from '@/components/analytics/MetricSelector';
import { metricToSeries } from './adapters';

export type AnalyticsPageProps = {
  data?: ServiceOutput;
};

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ data }) => {
  const { flags } = useConfig();
  const metricKeys = data?.metricKeys ?? [];
  const [metric, setMetric] = React.useState<MetricKey>(metricKeys[0] ?? 'volume');

  React.useEffect(() => {
    console.debug('[AnalyticsPage] render, derivedKpis=', flags.derivedKpis, 'metricKeys=', metricKeys);
  }, [flags.derivedKpis, metricKeys]);

  const series = React.useMemo(() => {
    const adapter = metricToSeries[metric];
    return data ? adapter(data.series) : [];
  }, [metric, data]);

  const kpis = data?.totalsKpis;

  return (
    <div>
      {flags.derivedKpis && kpis && (
        <div className="flex gap-4 mb-4">
          <div data-testid="kpi-density">
            <div>Density</div>
            <div>{fmtKgPerMin(kpis.densityKgPerMin)}</div>
          </div>
          <div data-testid="kpi-rest">
            <div>Avg Rest</div>
            <div>{fmtSeconds(kpis.avgRestSec)}</div>
          </div>
          <div data-testid="kpi-efficiency">
            <div>Set Efficiency</div>
            <div>{fmtRatio(kpis.setEfficiency)}</div>
          </div>
        </div>
      )}

      <MetricSelector metricKeys={metricKeys} value={metric} onChange={setMetric} />

      <pre data-testid="series">{JSON.stringify(series, null, 2)}</pre>
    </div>
  );
};

export default AnalyticsPage;
