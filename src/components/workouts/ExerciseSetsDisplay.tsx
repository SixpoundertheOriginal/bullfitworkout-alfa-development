
import React from 'react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ClipboardEdit, Trash2, Clock, ArrowRight } from "lucide-react";
import { ExerciseSet } from "@/types/exercise";
import { cn } from "@/lib/utils";
import { getDisplayRestLabelByIndex, formatRestForDisplay } from "@/utils/restDisplay";
import { formatTime } from "@/utils/formatTime";

interface ExerciseSetsDisplayProps {
  exerciseName: string;
  sets: ExerciseSet[];
  onEdit: (exerciseName: string) => void;
  onDelete: (exerciseName: string) => void;
  onSelect?: () => void;
  isSelected?: boolean;
}

export const ExerciseSetsDisplay: React.FC<ExerciseSetsDisplayProps> = ({
  exerciseName,
  sets,
  onEdit,
  onDelete,
  onSelect,
  isSelected = false,
}) => {
  // Calculate average rest time (exclude first set)
  const completedSets = sets.filter(set => set.completed);
  const restTimes = sets.slice(1).map(set => (set.restTime ?? 0));
  const avgRestTimeSec = restTimes.length ?
    restTimes.reduce((sum, time) => sum + time, 0) / restTimes.length : 0;

  const getRestTimeClass = (restTime: number | undefined) => {
    if (!restTime) return "text-gray-500";
    if (restTime < 30) return "text-red-400";
    if (restTime < 60) return "text-yellow-400";
    if (restTime < 120) return "text-green-400";
    return "text-blue-400";
  };

  const formatRestTime = (seconds: number | undefined) => {
    if (!seconds) return "—";
    return `${seconds}s`;
  };

  return (
    <div 
      className={cn(
        "bg-gray-800/50 rounded-lg p-3 transition-all duration-300",
        isSelected ? "ring-2 ring-purple-500/50" : "hover:bg-gray-800/70 cursor-pointer"
      )}
      onClick={onSelect}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <h4 className="font-medium text-sm">{exerciseName}</h4>
          {isSelected && <ArrowRight size={14} className="ml-2 text-purple-400" />}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { 
              e.stopPropagation();
              onEdit(exerciseName);
            }}
            className="h-7 w-7 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <ClipboardEdit size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { 
              e.stopPropagation();
              onDelete(exerciseName);
            }}
            className="h-7 w-7 text-gray-400 hover:text-red-400 hover:bg-gray-700"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center mb-2 text-xs text-gray-400">
        <Clock size={12} className="mr-1" />
        <span>Avg Rest: <span className={getRestTimeClass(avgRestTimeSec)}>{formatTime(Math.round(avgRestTimeSec))}</span></span>
      </div>
      
      <div className="grid grid-cols-5 gap-1 text-xs text-gray-400">
        <div>Set</div>
        <div className="text-right">Weight</div>
        <div className="text-right">Reps</div>
        <div className="text-right">Rest</div>
        <div className="text-right">Volume</div>
      </div>
      
      <Separator className="my-1 bg-gray-700" />
      
      {sets.map((set, index) => (
        <div 
          key={index} 
          className={`grid grid-cols-5 gap-1 text-sm py-1 ${!set.completed ? "text-gray-500" : ""}`}
        >
          <div>{set.set_number}</div>
          <div className="text-right font-mono">{set.weight}</div>
          <div className="text-right font-mono">{set.reps}</div>
          <div className={`text-right font-mono ${getRestTimeClass(set.restTime)}`}>
            {(() => {
              const label = getDisplayRestLabelByIndex(set.restTime, index);
              return label.type === 'start' ? 'Start' : formatRestForDisplay(label);
            })()}
          </div>
          <div className="text-right font-mono">{set.weight * set.reps}</div>
        </div>
      ))}
    </div>
  );
};
