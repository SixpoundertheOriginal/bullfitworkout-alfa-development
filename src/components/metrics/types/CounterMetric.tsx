import React from 'react';
import { BaseMetric } from '../core/BaseMetric';
import { MetricData } from '../core/MetricRegistry';

interface CounterMetricProps {
  data: MetricData;
  className?: string;
  showIncrement?: boolean;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export const CounterMetric: React.FC<CounterMetricProps> = ({ 
  data, 
  className,
  showIncrement = false,
  onIncrement,
  onDecrement 
}) => {
  return (
    <BaseMetric 
      data={data} 
      className={className}
    />
  );
};