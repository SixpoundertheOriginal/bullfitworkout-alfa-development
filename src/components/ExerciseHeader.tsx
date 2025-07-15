
import React from 'react';
import { Dumbbell } from 'lucide-react';
import { typography } from '@/lib/typography';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ExerciseHeaderProps {
  exerciseName: string;
  lastSession?: {
    weight: number;
    reps: number;
    sets: number;
  };
  weightUnit: string;
}

// Max chars before truncating with ellipsis for exerciseName
const MAX_EXERCISE_NAME_LENGTH = 22;

export const ExerciseHeader = ({ exerciseName, lastSession, weightUnit }: ExerciseHeaderProps) => {
  const isLong = exerciseName.length > MAX_EXERCISE_NAME_LENGTH;
  const displayName = isLong
    ? exerciseName.slice(0, MAX_EXERCISE_NAME_LENGTH - 2) + "…"
    : exerciseName;

  return (
    <div className="flex items-start justify-between mb-4 p-4 rounded-lg bg-gray-900/50 backdrop-blur-sm border border-gray-800">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-purple-400" />
          {isLong ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <h2 className={typography.headings.h2 + " tracking-tight cursor-pointer max-w-xs"}>
                  {displayName}
                </h2>
              </TooltipTrigger>
              <TooltipContent side="top">
                {exerciseName}
              </TooltipContent>
            </Tooltip>
          ) : (
            <h2 className={typography.headings.h2 + " tracking-tight"}>
              {exerciseName}
            </h2>
          )}
        </div>
        {lastSession && (
          <p className={typography.text.small}>
            Last session:{' '}
            <span className={typography.text.numeric}>
              {lastSession.weight} {weightUnit} × {lastSession.reps} × {lastSession.sets}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};
