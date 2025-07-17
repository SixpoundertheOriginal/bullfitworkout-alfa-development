import React from 'react';
import { SetRow } from '@/components/SetRow';
import { ExerciseSet } from '@/types/exercise';
import { useWeightUnit } from "@/context/WeightUnitContext";

interface SetsListProps {
  sets: ExerciseSet[];
  exercise: string;
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
  onShowRestTimer: () => void;
  onResetRestTimer: () => void;
}

export const SetsList: React.FC<SetsListProps> = ({
  sets,
  exercise,
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
  onShowRestTimer,
  onResetRestTimer,
}) => {
  const { weightUnit } = useWeightUnit();

  if (sets.length === 0) {
    return (
      <div className="py-6 text-center text-muted-foreground">
        <p>No sets added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 mb-4">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium mb-2 px-2">
        <div className="col-span-1">Set</div>
        <div className="col-span-3">Weight</div>
        <div className="col-span-3">Reps</div>
        <div className="col-span-3">Rest</div>
        <div className="col-span-2">Actions</div>
      </div>

      {/* Sets */}
      <div className="border border-border/30 rounded-lg overflow-hidden bg-muted/20">
        {sets.map((set, index) => (
          <div key={index} className={index > 0 ? "border-t border-border/20" : ""}>
            <SetRow 
              setNumber={index + 1}
              weight={set.weight}
              reps={set.reps}
              restTime={set.restTime}
              completed={set.completed}
              isEditing={set.isEditing || false}
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
              weightUnit={weightUnit}
              currentVolume={set.weight * set.reps}
            />
          </div>
        ))}
      </div>
    </div>
  );
};