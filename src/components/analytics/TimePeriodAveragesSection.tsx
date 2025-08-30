import React from 'react';
import { TrendingUp, Clock, BarChart, Repeat } from 'lucide-react';
import type { TimePeriodAveragesOutput } from '@/services/metrics-v2/calculators/timePeriodAveragesCalculator';

interface TimePeriodAveragesSectionProps {
  timePeriodAverages?: TimePeriodAveragesOutput;
  isLoading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  className?: string;
}

const MetricCard = ({ title, value, unit, icon, className = '' }: MetricCardProps) => (
  <div className={`bg-gradient-to-br from-card to-card/70 backdrop-blur-sm p-3 rounded-lg border border-border/30 hover:border-primary/30 transition-all group ${className}`}>
    <div className="flex items-center gap-2 mb-2">
      <div className="text-muted-foreground group-hover:text-primary transition-colors">
        {icon}
      </div>
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</div>
    </div>
    <div className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
      {value}
      <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
    </div>
  </div>
);

export const TimePeriodAveragesSection = ({ 
  timePeriodAverages, 
  isLoading 
}: TimePeriodAveragesSectionProps) => {
  if (isLoading || !timePeriodAverages) {
    return <TimePeriodAveragesSkeleton />;
  }
  
  const periods = [
    { key: 'thisWeek', data: timePeriodAverages.thisWeek },
    { key: 'thisMonth', data: timePeriodAverages.thisMonth },
    { key: 'last7Days', data: timePeriodAverages.last7Days },
    { key: 'last30Days', data: timePeriodAverages.last30Days }
  ];
  
  return (
    <div className="space-y-6" data-testid="time-period-averages">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-foreground">
          Average Performance by Period
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent"></div>
      </div>
      
      {periods.map(({ key, data }) => (
        <div key={key} className="space-y-3" data-testid={`period-${key}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground">
              {data.periodLabel}
            </h3>
            <div className="text-sm text-muted-foreground bg-muted/20 px-2 py-1 rounded-md">
              {data.totalWorkouts} workout{data.totalWorkouts !== 1 ? 's' : ''}
            </div>
          </div>
          
          {data.totalWorkouts > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                title="Tonnage"
                value={data.averageTonnagePerWorkout}
                unit="kg"
                icon={<TrendingUp size={16} />}
              />
              
              <MetricCard
                title="Duration"
                value={data.averageDurationPerWorkout}
                unit="min"
                icon={<Clock size={16} />}
              />
              
              <MetricCard
                title="Sets"
                value={data.averageSetsPerWorkout}
                unit="sets"
                icon={<BarChart size={16} />}
              />
              
              <MetricCard
                title="Reps"
                value={data.averageRepsPerWorkout}
                unit="reps"
                icon={<Repeat size={16} />}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg border border-muted/20">
              <div className="text-sm">No workouts in this period</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const TimePeriodAveragesSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <div className="h-6 bg-muted/20 rounded animate-pulse w-64" />
      <div className="h-px flex-1 bg-muted/20 animate-pulse"></div>
    </div>
    {[...Array(4)].map((_, i) => (
      <div key={i} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-muted/20 rounded animate-pulse w-32" />
          <div className="h-6 bg-muted/20 rounded animate-pulse w-20" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, j) => (
            <div key={j} className="h-20 bg-muted/10 rounded-lg animate-pulse border border-muted/20" />
          ))}
        </div>
      </div>
    ))}
  </div>
);