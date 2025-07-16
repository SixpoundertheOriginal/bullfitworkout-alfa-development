import React from 'react';
import { MetricData } from './MetricRegistry';
import { MetricCard } from '../MetricCard';
import { cn } from '@/lib/utils';

interface BaseMetricProps {
  data: MetricData;
  className?: string;
  onClick?: () => void;
}

export const BaseMetric: React.FC<BaseMetricProps> = ({ 
  data, 
  className,
  onClick 
}) => {
  const { config, value } = data;
  
  const getStatusStyles = () => {
    switch (value.status) {
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'critical':
        return 'border-red-500/30 bg-red-500/5';
      default:
        return '';
    }
  };

  return (
    <MetricCard
      icon={config.icon}
      value={value.value}
      label={config.label}
      tooltip={config.tooltip}
      description={value.description}
      progressValue={value.progress}
      className={cn(
        getStatusStyles(),
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    />
  );
};