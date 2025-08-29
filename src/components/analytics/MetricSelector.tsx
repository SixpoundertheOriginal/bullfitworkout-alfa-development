import React from 'react';
import { getMetricOptions, type ChartMetric } from '@/pages/analytics/metricOptions';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import type { MetricKey } from '@/services/metrics-v2/dto';

export interface MetricSelectorProps {
  metricKeys: readonly MetricKey[];
  value: ChartMetric;
  onChange: (m: ChartMetric) => void;
}

export function MetricSelector({ metricKeys, value, onChange }: MetricSelectorProps) {
  const options = getMetricOptions(metricKeys);
  console.debug('[MetricSelector] items=', options.map(o => o.key), 'flag=', FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED);

  React.useEffect(() => {
    if (!options.some(o => o.key === value)) {
      onChange(options[0]?.key ?? 'volume');
    }
  }, [options, value, onChange]);

  return (
    <select value={value} onChange={e => onChange(e.target.value as ChartMetric)} data-testid="metric-select">
      {options.map(o => (
        <option key={o.key} value={o.key}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default MetricSelector;
