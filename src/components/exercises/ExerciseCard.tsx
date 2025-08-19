import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, ArrowDownRight, PlusCircle, Trash2 } from 'lucide-react';
import { SetRow } from '@/components/SetRow';
import { Badge } from "@/components/ui/badge";
import { ExerciseHeader } from '@/components/ExerciseHeader';
import { useWeightUnit } from "@/context/WeightUnitContext";
import { useExercises } from "@/hooks/useExercises";
import { convertWeight, formatWeightWithUnit, WeightUnit } from "@/utils/unitConversion";

interface ExerciseHistoryData {
  [exerciseName: string]: {
    date: string;
    weight: number;
    reps: number;
    sets: number;
    exerciseGroup?: string;
  }[];
}

interface ExerciseCardProps {
  exercise: string;
  sets: { weight: number; reps: number; restTime?: number; completed: boolean; isEditing?: boolean; isWarmup?: boolean }[];
  onAddSet: () => void;
  onCompleteSet: (setIndex: number) => void;
  onRemoveSet: (setIndex: number) => void;
  onEditSet: (setIndex: number) => void;
  onSaveSet: (setIndex: number) => void;
  onWeightChange: (setIndex: number, value: string) => void;
  onRepsChange: (setIndex: number, value: string) => void;
  onRestTimeChange?: (setIndex: number, value: string) => void;
  onWeightIncrement: (setIndex: number, increment: number) => void;
  onRepsIncrement: (setIndex: number, increment: number) => void;
  onRestTimeIncrement?: (setIndex: number, increment: number) => void;
  onWarmupToggle?: (setIndex: number) => void;
  isActive: boolean;
  onShowRestTimer: () => void;
  onResetRestTimer: () => void;
  onDeleteExercise: () => void;
}

// Sample exercise history data with exercise groups
const exerciseHistoryData: ExerciseHistoryData = {
  "Bench Press": [
    { date: "Apr 10", weight: 135, reps: 10, sets: 3, exerciseGroup: "chest" },
    { date: "Apr 3", weight: 130, reps: 10, sets: 3, exerciseGroup: "chest" },
    { date: "Mar 27", weight: 125, reps: 8, sets: 3, exerciseGroup: "chest" },
  ],
  "Squats": [
    { date: "Apr 9", weight: 185, reps: 8, sets: 3, exerciseGroup: "legs" },
    { date: "Apr 2", weight: 175, reps: 8, sets: 3, exerciseGroup: "legs" },
    { date: "Mar 26", weight: 165, reps: 8, sets: 3, exerciseGroup: "legs" },
  ],
  "Deadlift": [
    { date: "Apr 8", weight: 225, reps: 5, sets: 3, exerciseGroup: "back" },
    { date: "Apr 1", weight: 215, reps: 5, sets: 3, exerciseGroup: "back" },
    { date: "Mar 25", weight: 205, reps: 5, sets: 3, exerciseGroup: "back" },
  ],
  "Pull-ups": [
    { date: "Apr 7", weight: 0, reps: 8, sets: 3, exerciseGroup: "back" },
    { date: "Mar 31", weight: 0, reps: 7, sets: 3, exerciseGroup: "back" },
    { date: "Mar 24", weight: 0, reps: 6, sets: 3, exerciseGroup: "back" },
  ],
};

const getPreviousSessionData = (exerciseName: string) => {
  const history = exerciseHistoryData[exerciseName] || [];
  if (history.length > 0) {
    return history[0];
  }
  
  return { date: "N/A", weight: 0, reps: 0, sets: 0, exerciseGroup: "" };
};

const ExerciseCard = ({ 
  exercise, 
  sets,
  onAddSet,
  onCompleteSet,
  onRemoveSet,
  onEditSet,
  onSaveSet,
  onWeightChange,
  onRepsChange,
  onRestTimeChange,
  onWeightIncrement,
  onRepsIncrement,
  onRestTimeIncrement,
  onWarmupToggle,
  isActive,
  onShowRestTimer,
  onResetRestTimer,
  onDeleteExercise
}) => {
  const { weightUnit } = useWeightUnit();
  const { exercises: dbExercises } = useExercises();
  
  const previousSession = getPreviousSessionData(exercise);
  const olderSession = exerciseHistoryData[exercise]?.[1] || previousSession;
  
  const previousSessionWeight = convertWeight(previousSession.weight, "lb", weightUnit);
  
  const weightDiff = previousSession.weight - olderSession.weight;
  const percentChange = olderSession.weight ? ((weightDiff / olderSession.weight) * 100).toFixed(1) : "0";
  const isImproved = weightDiff > 0;

  const calculateCurrentVolume = (sets: { weight: number; reps: number; completed: boolean }[]) => {
    return sets.reduce((total, set) => {
      if (set.completed && set.weight > 0 && set.reps > 0) {
        return total + (set.weight * set.reps);
      }
      return total;
    }, 0);
  };

  const currentVolume = calculateCurrentVolume(sets);
  const previousVolume = previousSession.weight > 0 ? 
    (convertWeight(previousSession.weight, "lb", weightUnit) * previousSession.reps * previousSession.sets) : 0;
  
  const volumeDiff = currentVolume > 0 && previousVolume > 0 ? (currentVolume - previousVolume) : 0;
  const volumePercentChange = previousVolume > 0 ? ((volumeDiff / previousVolume) * 100).toFixed(1) : "0";

  // Check if this exercise has a group and if there's previous session data with the same group
  const exerciseGroup = previousSession?.exerciseGroup || "";
  const hasSameGroupData = exerciseGroup && previousVolume > 0;

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 ${
      isActive ? "ring-2 ring-purple-500/50" : "ring-1 ring-gray-800"
    }`}>
      <CardContent className="p-0">
        <ExerciseHeader
          exerciseName={exercise}
          lastSession={{
            weight: previousSessionWeight,
            reps: previousSession.reps,
            sets: previousSession.sets
          }}
          weightUnit={weightUnit}
        />

        {/* Add Delete Button for Exercise */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 text-gray-400 hover:text-red-500 hover:bg-gray-800/50"
          onClick={onDeleteExercise}
          aria-label="Delete exercise"
        >
          <Trash2 size={16} />
        </Button>
        
        <div className="px-4 pb-4">
          <Progress 
            value={0}
            className="h-1.5 mb-6 bg-gray-800/50 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500"
          />

          <div className="space-y-1">
            {sets.map((set, index) => (
              <SetRow 
                key={index}
                setNumber={index + 1}
                weight={set.weight}
                reps={set.reps}
                restTime={set.restTime}
                completed={set.completed}
                isEditing={set.isEditing || false}
                isWarmup={set.isWarmup || false}
                exerciseName={exercise}
                onComplete={() => onCompleteSet(index)}
                onEdit={() => onEditSet(index)}
                onSave={() => onSaveSet(index)}
                onRemove={() => onRemoveSet(index)}
                onWeightChange={(e) => onWeightChange(index, e.target.value)}
                onRepsChange={(e) => onRepsChange(index, e.target.value)}
                onRestTimeChange={onRestTimeChange ? (e) => onRestTimeChange(index, e.target.value) : undefined}
                onWeightIncrement={(value) => onWeightIncrement(index, value)}
                onRepsIncrement={(value) => onRepsIncrement(index, value)}
                onRestTimeIncrement={onRestTimeIncrement ? (value) => onRestTimeIncrement(index, value) : undefined}
                onWarmupToggle={() => onWarmupToggle?.(index)}
                weightUnit={weightUnit}
                currentVolume={set.weight * set.reps}
              />
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Current Volume</span>
              <span className="font-mono">
                {currentVolume.toFixed(1)} {weightUnit}
              </span>
            </div>
            
            {hasSameGroupData && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">vs Previous Session</span>
                <span className={`font-mono ${volumeDiff >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {volumeDiff > 0 ? "+" : ""}{volumeDiff.toFixed(1)} {weightUnit} ({volumePercentChange}%)
                </span>
              </div>
            )}

            {hasSameGroupData && (
              <Progress 
                value={currentVolume > 0 ? 
                  Math.min((currentVolume / Math.max(previousVolume, 1)) * 100, 200) : 0} 
                className={`h-1.5 mt-2 bg-gray-800 ${
                  currentVolume >= previousVolume ? "[&>div]:bg-green-500" : "[&>div]:bg-red-500"
                }`}
              />
            )}
          </div>

          <Button
            onClick={onAddSet}
            className="w-full mt-4 py-3 flex items-center justify-center text-sm 
              bg-gradient-to-r from-purple-600 to-pink-500 
              hover:from-purple-700 hover:to-pink-600 
              text-white font-medium rounded-full 
              transition-all duration-300 
              transform hover:scale-[1.02] active:scale-[0.98] 
              shadow-lg hover:shadow-xl 
              group"
          >
            <PlusCircle 
              size={24} 
              className="mr-2 group-hover:rotate-90 transition-transform duration-300" 
            />
            Add Set
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExerciseCard;
