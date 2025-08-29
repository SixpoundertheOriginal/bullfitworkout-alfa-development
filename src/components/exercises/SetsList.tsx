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
  onFailurePointChange?: (setIndex: number, value: 'none'|'technical'|'muscular') => void;
  onFormScoreChange?: (setIndex: number, value: number | undefined) => void;
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
  onFailurePointChange,
  onFormScoreChange,
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
    <div className="space-y-4">
      {/* Futuristic Header with holographic effects */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-xl blur-lg"></div>
        <div className="relative grid grid-cols-12 gap-2 text-xs font-bold mb-3 px-4 py-3 bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-xl border border-slate-600/30 backdrop-blur-sm">
          <div className="col-span-1 text-center text-slate-300">Set</div>
          <div className="col-span-2 text-center text-slate-300">Weight</div>
          <div className="col-span-2 text-center text-slate-300">Reps</div>
          <div className="col-span-2 text-center text-slate-300">Rest</div>
          <div className="col-span-5 text-center text-slate-300">Actions</div>
        </div>
      </div>

      {/* Enhanced Sets Container with neural network styling */}
      <div className="relative border border-slate-700/40 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900/60 to-slate-800/60 backdrop-blur-sm shadow-2xl">
        {/* Neural connection pattern */}
        <div className="absolute inset-0 opacity-10">
          {sets.map((_, index) => (
            <div key={index} className="absolute left-0 right-0" style={{ top: `${(index + 0.5) * (100 / sets.length)}%` }}>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"></div>
            </div>
          ))}
        </div>
        
        {sets.map((set, index) => (
          <div 
            key={index} 
            className={`
              relative z-10 transition-all duration-300 hover:bg-slate-800/40
              ${index > 0 ? "border-t border-slate-700/30" : ""} 
              ${set.completed ? "bg-gradient-to-r from-green-500/5 to-green-400/5" : ""}
            `}
          >
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
              showRestTimer={true}
              onRestTimerComplete={() => onResetRestTimer()}
              failurePoint={set.failurePoint}
              formScore={set.formScore}
              onFailurePointChange={onFailurePointChange ? (value) => onFailurePointChange(index, value) : undefined}
              onFormScoreChange={onFormScoreChange ? (value) => onFormScoreChange(index, value) : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
};