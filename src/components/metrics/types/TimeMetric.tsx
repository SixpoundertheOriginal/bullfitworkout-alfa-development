import React from 'react';
import { BaseMetric } from '../core/BaseMetric';
import { MetricData } from '../core/MetricRegistry';

interface TimeMetricProps {
  data: MetricData;
  className?: string;
  showElapsedTime?: boolean;
  onTimeClick?: () => void;
}

export const TimeMetric: React.FC<TimeMetricProps> = ({ 
  data, 
  className, 
  showElapsedTime = true,
  onTimeClick 
}) => {
  return (
    <BaseMetric 
      data={data} 
      className={className}
      onClick={onTimeClick}
    />
  );
};