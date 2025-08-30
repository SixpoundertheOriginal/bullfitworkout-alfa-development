import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MetricId } from '@/pages/analytics/metricIds';

export type MeasureOption = {
  id: MetricId;
  label: string;
  icon?: string;
};

export type MetricDropdownProps = {
  value: MetricId;
  onChange: (value: MetricId) => void;
  options: MeasureOption[];
  disabled?: boolean;
};

export const MetricDropdown: React.FC<MetricDropdownProps> = ({
  value,
  onChange,
  options,
  disabled = false,
}) => {
  const selectedOption = options.find(opt => opt.id === value);

  return (
    <Select 
      value={value} 
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger 
        className="w-48 bg-card border-border text-foreground"
        data-testid="metric-select"
      >
        <SelectValue>
          {selectedOption?.label || 'Select metric'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem 
            key={option.id} 
            value={option.id}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {option.icon && <span className="text-sm">{option.icon}</span>}
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};