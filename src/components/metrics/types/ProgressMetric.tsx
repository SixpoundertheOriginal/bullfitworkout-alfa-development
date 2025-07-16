import React from 'react';
import { BaseMetric } from '../core/BaseMetric';
import { MetricData } from '../core/MetricRegistry';

interface ProgressMetricProps {
  data: MetricData;
  className?: string;
  showPercentage?: boolean;
  onProgressClick?: () => void;
}

export const ProgressMetric: React.FC<ProgressMetricProps> = ({ 
  data, 
  className,
  showPercentage = false,
  onProgressClick 
}) => {
  return (
    <BaseMetric 
      data={data} 
      className={className}
      onClick={onProgressClick}
    />
  );
};