import React from 'react';
import type { MetricId } from '@/pages/analytics/metricIds';

interface Option { id: MetricId; label: string }

interface Props {
  value: MetricId;
  options: Option[];
  onChange: (m: MetricId) => void;
  disabled?: boolean;
}

export function MetricDropdown({ value, options, onChange, disabled }: Props) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as MetricId)}
      data-testid="metric-select"
      disabled={disabled}
      className="px-3 py-2 bg-card border border-border rounded-md text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all min-w-[180px]"
    >
      {options.map(o => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
