
import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  Dumbbell, 
  Clock, 
  TrendingUp, 
  MoreVertical,
  Eye,
  Copy,
  Trash2,
  BarChart3,
  Award,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { EnhancedWorkoutData } from '@/types/workout-enhanced';
import { trainingTypes } from '@/constants/trainingTypes';
import { useWeightUnit } from '@/context/WeightUnitContext';
import { formatWeightWithUnit } from '@/utils/unitConversion';
import { cn } from '@/lib/utils';

interface EnhancedWorkoutCardProps {
  workout: EnhancedWorkoutData;
  onView?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCompare?: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  compact?: boolean;
}

export const EnhancedWorkoutCard: React.FC<EnhancedWorkoutCardProps> = ({
  workout,
  onView,
  onDuplicate,
  onDelete,
  onCompare,
  isSelected = false,
  onSelect,
  compact = false,
}) => {
  const { weightUnit } = useWeightUnit();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const trainingType = trainingTypes.find(t => t.id === workout.training_type) || trainingTypes[0];
  const formattedDate = format(parseISO(workout.start_time), 'MMM d, yyyy');
  const formattedTime = format(parseISO(workout.start_time), 'h:mm a');

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(workout.id, !isSelected);
    } else if (onView) {
      onView(workout.id);
    }
  };

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case 'incomplete':
        return AlertTriangle;
      case 'progress':
        return CheckCircle;
      case 'pr':
        return Award;
      default:
        return CheckCircle;
    }
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
        "bg-gradient-to-br from-gray-900/90 to-gray-900/60 border-gray-800/50",
        isSelected && "ring-2 ring-purple-500/50 border-purple-500/30",
        workout.quality.hasIncompleteData && "border-yellow-700/50",
        compact ? "p-3" : "p-4"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-0 space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn("font-semibold text-white", compact ? "text-sm" : "text-base")}>
                {workout.name}
              </h3>
              {workout.quality.badges.map((badge, idx) => {
                const IconComponent = getBadgeIcon(badge.type);
                return (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="h-5 px-1.5 text-xs"
                    style={{ borderColor: badge.color, color: badge.color }}
                  >
                    <IconComponent className="w-3 h-3 mr-1" />
                    {badge.label}
                  </Badge>
                );
              })}
            </div>
            
            <div className="flex items-center text-gray-400 text-xs gap-3">
              <div className="flex items-center">
                <span 
                  className="w-2 h-2 rounded-full mr-1" 
                  style={{ backgroundColor: trainingType.color }} 
                />
                <span>{trainingType.name}</span>
              </div>
              <span>{formattedDate} • {formattedTime}</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-60 hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
              <DropdownMenuItem onClick={() => onView?.(workout.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(workout.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCompare?.(workout.id)}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Compare
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem 
                onClick={() => onDelete?.(workout.id)}
                className="text-red-500 hover:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-3 h-3 text-gray-500" />
            </div>
            <div className="text-white font-medium">{workout.duration}m</div>
            <div className="text-gray-500">Duration</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Dumbbell className="w-3 h-3 text-gray-500" />
            </div>
            <div className="text-white font-medium">
              {formatWeightWithUnit(workout.metrics.totalVolume, weightUnit)}
            </div>
            <div className="text-gray-500">Volume</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <BarChart3 className="w-3 h-3 text-gray-500" />
            </div>
            <div className="text-white font-medium">{workout.metrics.totalSets}</div>
            <div className="text-gray-500">Sets</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="w-3 h-3 text-gray-500" />
            </div>
            <div className="text-white font-medium">{workout.quality.qualityScore}</div>
            <div className="text-gray-500">Quality</div>
          </div>
        </div>

        {/* Quality Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Quality Score</span>
            <span className={cn(
              "font-medium",
              workout.quality.performanceLevel === 'excellent' ? "text-green-400" :
              workout.quality.performanceLevel === 'good' ? "text-blue-400" :
              workout.quality.performanceLevel === 'average' ? "text-yellow-400" : "text-red-400"
            )}>
              {workout.quality.performanceLevel}
            </span>
          </div>
          <Progress 
            value={workout.quality.qualityScore} 
            className="h-1.5"
          />
        </div>

        {/* Exercise Preview - Only show if not compact */}
        {!compact && workout.exercisePreview.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-300">Top Exercises</h4>
            <div className="space-y-1">
              {workout.exercisePreview.slice(0, 3).map((exercise, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-gray-300 truncate flex-1">{exercise.name}</span>
                  <span className="text-gray-500 ml-2">
                    {exercise.sets} sets • {Math.max(...exercise.reps, 0)} reps
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
