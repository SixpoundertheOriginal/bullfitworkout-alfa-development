import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LABELS: Record<string, string> = {
  duration_min: 'Duration (min)',
  tonnage_kg: 'Tonnage (kg)',
  density_kg_per_min: 'Density (kg/min)',
  reps: 'Reps',
  sets: 'Sets',
  avg_rest_sec: 'Avg Rest (sec)',
  set_efficiency_kg_per_min: 'Set Efficiency (kg/min)',
};

export type MetricDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
};

export const MetricDropdown: React.FC<MetricDropdownProps> = ({
  value,
  onChange,
  options,
  disabled = false,
}) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className="w-48 bg-card border-border text-foreground"
        data-testid="metric-select"
      >
        <SelectValue>{LABELS[value] || value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map(opt => (
          <SelectItem key={opt} value={opt} className="cursor-pointer">
            {LABELS[opt] || opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};