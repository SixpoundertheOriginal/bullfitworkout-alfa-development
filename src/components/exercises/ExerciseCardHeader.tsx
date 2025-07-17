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
    if (progressData.isImproved) return "text-success";
    if (progressData.weightDiff < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div className="relative p-4 pb-0">
      {/* Exercise Name */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-foreground leading-tight">
          {exerciseName}
        </h3>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={onDeleteExercise}
              className="text-destructive focus:text-destructive"
            >
              Delete Exercise
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Previous Session Info */}
      {previousSession.weight > 0 && (
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>Last:</span>
            <span className="font-mono text-foreground">
              {previousSession.weight}{weightUnit} × {previousSession.reps} × {previousSession.sets}
            </span>
          </div>
          
          {progressData.weightDiff !== 0 && (
            <Badge 
              variant="outline" 
              className={`flex items-center gap-1 ${getProgressColor()}`}
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
        <div className="mt-2">
          <Badge variant="secondary" className="text-xs">
            {previousSession.exerciseGroup}
          </Badge>
        </div>
      )}
    </div>
  );
};