import React from 'react';
import { BaseMetric } from '../core/BaseMetric';
import { MetricData } from '../core/MetricRegistry';
import { TopRestTimer } from '@/components/TopRestTimer';

interface TimerMetricProps {
  data: MetricData;
  className?: string;
  isActive?: boolean;
  onTimerComplete?: () => void;
  onTimerStart?: () => void;
  onTimerReset?: () => void;
  resetSignal?: number;
}

export const TimerMetric: React.FC<TimerMetricProps> = ({ 
  data, 
  className,
  isActive = false,
  onTimerComplete,
  onTimerStart,
  onTimerReset,
  resetSignal = 0
}) => {
  // For timer metrics, we can show either the base metric or the enhanced timer
  const showEnhancedTimer = isActive || data.config.calculationKey === 'restTimer';

  if (showEnhancedTimer) {
    return (
      <div className={className}>
        <TopRestTimer
          isActive={isActive}
          onComplete={onTimerComplete}
          onManualStart={onTimerStart}
          resetSignal={resetSignal}
          currentRestTime={data.value.rawValue}
        />
      </div>
    );
  }

  return (
    <BaseMetric 
      data={data} 
      className={className}
      onClick={onTimerStart}
    />
  );
};