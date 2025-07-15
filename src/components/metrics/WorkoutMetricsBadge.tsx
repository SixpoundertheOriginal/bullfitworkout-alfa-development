
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dumbbell, Activity, Target } from 'lucide-react';

interface WorkoutMetricsBadgeProps {
  icon: 'volume' | 'intensity' | 'muscle';
  label: string;
  value: string | number;
  className?: string;
}

export const WorkoutMetricsBadge = ({ 
  icon, 
  label, 
  value,
  className 
}: WorkoutMetricsBadgeProps) => {
  const getIcon = () => {
    switch (icon) {
      case 'volume':
        return <Dumbbell className="h-3 w-3" />;
      case 'intensity':
        return <Activity className="h-3 w-3" />;
      case 'muscle':
        return <Target className="h-3 w-3" />;
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-1 bg-gray-800/50 text-gray-300 hover:bg-gray-800",
        className
      )}
    >
      {getIcon()}
      <span className="text-xs font-normal">
        {label}: {value}
      </span>
    </Badge>
  );
};
