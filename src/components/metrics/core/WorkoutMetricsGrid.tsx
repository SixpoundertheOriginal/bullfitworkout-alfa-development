import React, { useMemo } from 'react';
import { MetricRegistry, MetricConfig } from './MetricRegistry';
import { MetricCalculator, WorkoutMetricsData } from '../calculators/MetricCalculator';
import { TimeMetric } from '../types/TimeMetric';
import { CounterMetric } from '../types/CounterMetric';
import { ProgressMetric } from '../types/ProgressMetric';
import { TimerMetric } from '../types/TimerMetric';
import { Clock, Dumbbell, Target, Timer, Hash, Weight } from 'lucide-react';

interface WorkoutMetricsGridProps {
  workoutData: WorkoutMetricsData;
  className?: string;
  maxMetrics?: number;
  onRestTimerComplete?: () => void;
  onRestTimerStart?: () => void;
  onRestTimerReset?: () => void;
  restTimerResetSignal?: number;
}

export const WorkoutMetricsGrid: React.FC<WorkoutMetricsGridProps> = ({
  workoutData,
  className = '',
  maxMetrics = 4,
  onRestTimerComplete,
  onRestTimerStart,
  onRestTimerReset,
  restTimerResetSignal = 0
}) => {
  const registry = MetricRegistry.getInstance();
  const calculator = MetricCalculator.getInstance();

  // Initialize metrics if not already done
  useMemo(() => {
    // Clear existing metrics and register new ones
    registry.register({
      id: 'elapsedTime',
      type: 'time',
      label: 'Time',
      icon: Clock,
      tooltip: 'Total workout duration',
      priority: 1,
      isRealTime: true,
      calculationKey: 'elapsedTime',
      displayFormat: 'time'
    });

    registry.register({
      id: 'exerciseCount',
      type: 'counter',
      label: 'Exercises',
      icon: Dumbbell,
      tooltip: 'Number of exercises in workout',
      priority: 2,
      isRealTime: true,
      calculationKey: 'exerciseCount',
      displayFormat: 'number'
    });

    registry.register({
      id: 'setsProgress',
      type: 'progress',
      label: 'Sets',
      icon: Target,
      tooltip: 'Completed sets progress',
      priority: 3,
      isRealTime: true,
      calculationKey: 'setsProgress',
      displayFormat: 'number'
    });

    registry.register({
      id: 'repsCount',
      type: 'counter',
      label: 'Reps',
      icon: Hash,
      tooltip: 'Total completed reps',
      priority: 4,
      isRealTime: true,
      calculationKey: 'repsCount',
      displayFormat: 'number'
    });

    registry.register({
      id: 'totalVolume',
      type: 'counter',
      label: 'Volume',
      icon: Weight,
      tooltip: 'Total weight lifted',
      priority: 5,
      isRealTime: true,
      calculationKey: 'totalVolume',
      displayFormat: 'number'
    });

    registry.register({
      id: 'restTimer',
      type: 'timer',
      label: 'Rest',
      icon: Timer,
      tooltip: 'Rest timer status',
      priority: 6,
      isRealTime: true,
      calculationKey: 'restTimer',
      displayFormat: 'time'
    });
  }, []);

  const metrics = useMemo(() => {
    const highPriorityMetrics = registry.getHighPriorityMetrics(maxMetrics);
    
    return highPriorityMetrics.map(config => {
      const value = calculator.calculateMetric(config, workoutData);
      return {
        config,
        value
      };
    });
  }, [workoutData, maxMetrics]);

  const renderMetric = (metricData: { config: MetricConfig; value: any }) => {
    const { config } = metricData;
    
    switch (config.type) {
      case 'time':
        return (
          <TimeMetric 
            key={config.id}
            data={metricData}
            className="h-full"
          />
        );
      
      case 'counter':
        return (
          <CounterMetric 
            key={config.id}
            data={metricData}
            className="h-full"
          />
        );
      
      case 'progress':
        return (
          <ProgressMetric 
            key={config.id}
            data={metricData}
            className="h-full"
          />
        );
      
      case 'timer':
        return (
          <TimerMetric 
            key={config.id}
            data={metricData}
            className="h-full"
            isActive={workoutData.restTimerActive}
            onTimerComplete={onRestTimerComplete}
            onTimerStart={onRestTimerStart}
            onTimerReset={onRestTimerReset}
            resetSignal={restTimerResetSignal}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {metrics.map(renderMetric)}
    </div>
  );
};