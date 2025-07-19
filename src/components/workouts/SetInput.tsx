
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ChevronUp, ChevronDown, Timer, TrendingUp } from 'lucide-react';
import { ExerciseSet } from '@/hooks/useWorkoutState';
import { useWeightUnit } from '@/context/WeightUnitContext';

interface SetInputProps {
  set: ExerciseSet & {
    startTime?: string;
    endTime?: string;
    actualRestTime?: number;
  };
  exerciseName: string;
  index: number;
  onComplete: (setData: {
    startTime: string;
    endTime: string;
    actualRestTime?: number;
  }) => void;
  previousSetEndTime?: string;
}

export const SetInput: React.FC<SetInputProps> = ({
  set,
  exerciseName,
  index,
  onComplete,
  previousSetEndTime
}) => {
  const { weightUnit } = useWeightUnit();
  const [weight, setWeight] = useState(set.weight.toString());
  const [reps, setReps] = useState(set.reps.toString());
  const [setStartTime, setSetStartTime] = useState<string | null>(null);
  const [actualRestTime, setActualRestTime] = useState<number | null>(null);

  // Calculate actual rest time if we have previous set end time
  useEffect(() => {
    if (previousSetEndTime && !setStartTime) {
      const restTime = Math.floor((Date.now() - new Date(previousSetEndTime).getTime()) / 1000);
      setActualRestTime(restTime);
    }
  }, [previousSetEndTime, setStartTime]);

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

  const handleStartSet = () => {
    const startTime = new Date().toISOString();
    setSetStartTime(startTime);
  };

  const handleComplete = () => {
    const endTime = new Date().toISOString();
    const startTime = setStartTime || new Date().toISOString();
    
    onComplete({
      startTime,
      endTime,
      actualRestTime: actualRestTime || undefined
    });
  };

  const isSetInProgress = setStartTime && !set.completed;
  const setDuration = isSetInProgress ? 
    Math.floor((Date.now() - new Date(setStartTime).getTime()) / 1000) : 0;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-md p-3">
      {/* Timing info display */}
      {actualRestTime && (
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-gray-400 flex items-center">
            <Timer className="w-3 h-3 mr-1" />
            Rest: {actualRestTime}s
          </span>
          <span className={`flex items-center ${
            actualRestTime < (set.restTime || 60) ? 'text-red-400' : 
            actualRestTime > (set.restTime || 60) * 1.2 ? 'text-orange-400' : 'text-green-400'
          }`}>
            <TrendingUp className="w-3 h-3 mr-1" />
            {actualRestTime < (set.restTime || 60) ? 'Short' : 
             actualRestTime > (set.restTime || 60) * 1.2 ? 'Long' : 'Optimal'}
          </span>
        </div>
      )}

      {isSetInProgress && (
        <div className="mb-2 text-center">
          <span className="text-sm text-blue-400">Set in progress: {setDuration}s</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Weight ({weightUnit})</label>
          <div className="flex">
            <Input
              type="number"
              value={weight}
              onChange={handleWeightChange}
              className="bg-gray-800 border-gray-700"
              disabled={isSetInProgress}
            />
            <div className="flex flex-col ml-2">
              <Button
                variant="outline" 
                size="sm"
                className="px-2 py-0 h-6 bg-gray-800 border-gray-700"
                onClick={() => handleWeightIncrement(2.5)}
                disabled={isSetInProgress}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline" 
                size="sm"
                className="px-2 py-0 h-6 mt-1 bg-gray-800 border-gray-700"
                onClick={() => handleWeightIncrement(-2.5)}
                disabled={isSetInProgress}
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
              disabled={isSetInProgress}
            />
            <div className="flex flex-col ml-2">
              <Button
                variant="outline" 
                size="sm"
                className="px-2 py-0 h-6 bg-gray-800 border-gray-700"
                onClick={() => handleRepsIncrement(1)}
                disabled={isSetInProgress}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline" 
                size="sm"
                className="px-2 py-0 h-6 mt-1 bg-gray-800 border-gray-700"
                onClick={() => handleRepsIncrement(-1)}
                disabled={isSetInProgress}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {!setStartTime ? (
        <Button 
          onClick={handleStartSet}
          className="w-full bg-blue-600 hover:bg-blue-700 mb-2"
        >
          <Timer className="mr-2 h-4 w-4" />
          Start Set
        </Button>
      ) : null}

      <Button 
        onClick={handleComplete}
        className="w-full bg-green-600 hover:bg-green-700"
        disabled={set.completed || !setStartTime}
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
