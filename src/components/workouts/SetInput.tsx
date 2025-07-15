
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ChevronUp, ChevronDown } from 'lucide-react';
import { ExerciseSet } from '@/hooks/useWorkoutState';
import { useWeightUnit } from '@/context/WeightUnitContext';

interface SetInputProps {
  set: ExerciseSet;
  exerciseName: string;
  index: number;
  onComplete: () => void;
}

export const SetInput: React.FC<SetInputProps> = ({
  set,
  exerciseName,
  index,
  onComplete
}) => {
  const { weightUnit } = useWeightUnit();
  const [weight, setWeight] = useState(set.weight.toString());
  const [reps, setReps] = useState(set.reps.toString());

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWeight(e.target.value);
  };

  const handleRepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReps(e.target.value);
  };

  const handleWeightIncrement = (inc: number) => {
    const currentWeight = parseFloat(weight) || 0;
    setWeight((currentWeight + inc).toString());
  };

  const handleRepsIncrement = (inc: number) => {
    const currentReps = parseInt(reps) || 0;
    setReps(Math.max(1, currentReps + inc).toString());
  };

  const handleComplete = () => {
    onComplete();
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-md p-3">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Weight ({weightUnit})</label>
          <div className="flex">
            <Input
              type="number"
              value={weight}
              onChange={handleWeightChange}
              className="bg-gray-800 border-gray-700"
            />
            <div className="flex flex-col ml-2">
              <Button
                variant="outline" 
                size="sm"
                className="px-2 py-0 h-6 bg-gray-800 border-gray-700"
                onClick={() => handleWeightIncrement(2.5)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline" 
                size="sm"
                className="px-2 py-0 h-6 mt-1 bg-gray-800 border-gray-700"
                onClick={() => handleWeightIncrement(-2.5)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Reps</label>
          <div className="flex">
            <Input
              type="number"
              value={reps}
              onChange={handleRepsChange}
              className="bg-gray-800 border-gray-700"
            />
            <div className="flex flex-col ml-2">
              <Button
                variant="outline" 
                size="sm"
                className="px-2 py-0 h-6 bg-gray-800 border-gray-700"
                onClick={() => handleRepsIncrement(1)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline" 
                size="sm"
                className="px-2 py-0 h-6 mt-1 bg-gray-800 border-gray-700"
                onClick={() => handleRepsIncrement(-1)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Button 
        onClick={handleComplete}
        className="w-full bg-green-600 hover:bg-green-700"
        disabled={set.completed}
      >
        {set.completed ? (
          <span className="flex items-center">
            <Check className="mr-2 h-4 w-4" />
            Completed
          </span>
        ) : (
          "Complete Set"
        )}
      </Button>
    </div>
  );
};
