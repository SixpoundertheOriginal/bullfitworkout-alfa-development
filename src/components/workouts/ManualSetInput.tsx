import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWeightUnit } from '@/context/WeightUnitContext';
import { Trash2 } from 'lucide-react';

interface ManualSetInputProps {
  setNumber: number;
  weight: number;
  reps: number;
  restTime: number;
  onWeightChange: (weight: number) => void;
  onRepsChange: (reps: number) => void;
  onRestTimeChange: (restTime: number) => void;
  onDelete: () => void;
  canDelete: boolean;
}

export const ManualSetInput: React.FC<ManualSetInputProps> = ({
  setNumber,
  weight,
  reps,
  restTime,
  onWeightChange,
  onRepsChange,
  onRestTimeChange,
  onDelete,
  canDelete
}) => {
  const { weightUnit } = useWeightUnit();

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
      <div className="flex items-center justify-center w-8 h-8 bg-purple-600 rounded-full text-white text-sm font-medium">
        {setNumber}
      </div>
      
      <div className="flex-1 grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Weight ({weightUnit})</label>
          <Input
            type="number"
            value={weight}
            onChange={(e) => onWeightChange(Number(e.target.value))}
            min="0"
            step="0.5"
            className="h-9"
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Reps</label>
          <Input
            type="number"
            value={reps}
            onChange={(e) => onRepsChange(Number(e.target.value))}
            min="0"
            className="h-9"
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Rest (sec)</label>
          <Input
            type="number"
            value={restTime}
            onChange={(e) => onRestTimeChange(Number(e.target.value))}
            min="0"
            className="h-9"
          />
        </div>
      </div>
      
      {canDelete && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};