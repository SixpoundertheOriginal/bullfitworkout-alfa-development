
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useWeightUnit } from "@/context/WeightUnitContext";

interface PreviousSession {
  date: string;
  weight: number;
  reps: number;
  sets: number;
  exerciseGroup?: string;
}

interface ProgressData {
  weightDiff: number;
  percentChange: string;
  isImproved: boolean;
}

interface ExerciseCardHeaderProps {
  exerciseName: string;
  previousSession: PreviousSession;
  progressData: ProgressData;
  onDeleteExercise: () => void;
}

export const ExerciseCardHeader: React.FC<ExerciseCardHeaderProps> = ({
  exerciseName,
  previousSession,
  progressData,
  onDeleteExercise
}) => {
  const { weightUnit } = useWeightUnit();

  const getProgressIcon = () => {
    if (progressData.isImproved) return <TrendingUp className="h-3 w-3" />;
    if (progressData.weightDiff < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getProgressColor = () => {
    if (progressData.isImproved) return "text-green-400";
    if (progressData.weightDiff < 0) return "text-red-400";
    return "text-gray-400";
  };

  return (
    <div className="relative p-4 pb-0">
      {/* Exercise Name */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-white leading-tight pr-2">
          {exerciseName}
        </h3>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="
                h-10 w-10 rounded-full flex-shrink-0
                text-gray-400 hover:text-white hover:bg-gray-800/60
                transition-all duration-200
              "
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="
              w-48 bg-gray-900/95 border-gray-700/50 rounded-xl 
              backdrop-blur-lg shadow-xl
            "
          >
            <DropdownMenuItem 
              onClick={onDeleteExercise}
              className="
                text-red-400 focus:text-red-300 focus:bg-red-500/10
                rounded-lg mx-1 my-1
              "
            >
              Delete Exercise
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Previous Session Info */}
      {previousSession.weight > 0 && (
        <div className="flex items-center gap-3 text-sm mb-2">
          <div className="flex items-center gap-1 text-gray-400">
            <span>Last:</span>
            <span className="font-mono text-white">
              {previousSession.weight}{weightUnit} × {previousSession.reps} × {previousSession.sets}
            </span>
          </div>
          
          {progressData.weightDiff !== 0 && (
            <Badge 
              variant="outline" 
              className={`
                flex items-center gap-1 ${getProgressColor()}
                border-gray-700/50 bg-gray-800/30 rounded-lg
              `}
            >
              {getProgressIcon()}
              <span className="font-mono">
                {progressData.weightDiff > 0 ? '+' : ''}{progressData.weightDiff}{weightUnit}
              </span>
              <span>({progressData.percentChange}%)</span>
            </Badge>
          )}
        </div>
      )}

      {/* Muscle Group Tag */}
      {previousSession.exerciseGroup && (
        <div className="mb-2">
          <Badge 
            variant="secondary" 
            className="
              text-xs bg-gray-800/50 text-gray-300 border-gray-700/50 rounded-lg
            "
          >
            {previousSession.exerciseGroup}
          </Badge>
        </div>
      )}
    </div>
  );
};
