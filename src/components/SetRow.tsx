import React, { useRef, useState } from "react";
import { MinusCircle, PlusCircle, Save, Trash2, Edit, Check, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWeightUnit } from "@/context/WeightUnitContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { isIsometricExercise, formatDuration, formatIsometricSet } from "@/utils/exerciseUtils";
import { useExerciseWeight } from '@/hooks/useExerciseWeight';
import { Exercise } from '@/types/exercise';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from "@/lib/utils";
import { CompactRestTimer } from '@/components/CompactRestTimer';
import { useRestTimeAnalytics } from '@/hooks/useRestTimeAnalytics';
import { useGlobalRestTimers } from '@/hooks/useGlobalRestTimers';
import { getDisplayRestLabelByIndex, formatRestForDisplay } from '@/utils/restDisplay';
import { useWorkoutStore } from '@/store/workoutStore';

interface SetRowProps {
  setNumber: number;
  weight: number;
  reps: number;
  duration?: number;
  restTime?: number;
  completed: boolean;
  isEditing: boolean;
  isWarmup?: boolean;
  exerciseName: string;
  onComplete: () => void;
  onEdit: () => void;
  onSave: () => void;
  onRemove: () => void;
  onWeightChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRepsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDurationChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRestTimeChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onWeightIncrement: (value: number) => void;
  onRepsIncrement: (value: number) => void;
  onDurationIncrement?: (value: number) => void;
  onRestTimeIncrement?: (value: number) => void;
  onWarmupToggle?: () => void;
  weightUnit: string;
  currentVolume?: number;
  exerciseData?: Exercise;
  userWeight?: number;
  onAutoAdvanceNext?: () => void;
  showRestTimer?: boolean;
  onRestTimerComplete?: () => void;
}

export const SetRow = ({
  setNumber,
  weight,
  reps,
  duration = 0,
  restTime = 60,
  completed,
  isEditing,
  isWarmup = false,
  exerciseName,
  onComplete,
  onEdit,
  onSave,
  onRemove,
  onWeightChange,
  onRepsChange,
  onDurationChange,
  onRestTimeChange,
  onWeightIncrement,
  onRepsIncrement,
  onDurationIncrement,
  onRestTimeIncrement,
  onWarmupToggle,
  weightUnit,
  currentVolume,
  exerciseData,
  userWeight,
  onAutoAdvanceNext,
  showRestTimer = false,
  onRestTimerComplete
}: SetRowProps) => {
  const { weightUnit: globalWeightUnit } = useWeightUnit();
  const isMobile = useIsMobile();
  const isIsometric = isIsometricExercise(exerciseName);
  const { logRestTime } = useRestTimeAnalytics();
  const { generateTimerId, isTimerActive, stopTimer, getTimer } = useGlobalRestTimers();
  
  const {
    weight: calculatedWeight,
    isAutoWeight,
    weightSource,
    updateWeight,
    resetToAuto
  } = useExerciseWeight({
    exercise: exerciseData,
    userWeight,
    defaultWeight: weight
  });

  const displayUnit = weightUnit || globalWeightUnit;
  const displayWeight = isEditing ? weight : (isAutoWeight ? calculatedWeight : weight);

  const { setSetStartTime, setSetEndTime } = useWorkoutStore();
  const handleFirstInteraction = React.useCallback(() => {
    setSetStartTime(exerciseName, setNumber);
  }, [exerciseName, setNumber, setSetStartTime]);

  const formatRestTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRestTimeIncrement = (increment: number) => {
    handleFirstInteraction();
    if (onRestTimeIncrement) {
      onRestTimeIncrement(increment);
    }
  };

  const handleManualRestTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFirstInteraction();
    if (onRestTimeChange) {
      onRestTimeChange(e);
    }
  };

  const handleSetComplete = () => {
    playCompleteAnimation();
  };

  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeDelta, setSwipeDelta] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  
  // Generate unique timer ID for this set
  const timerId = generateTimerId(exerciseName, setNumber);
  const restTimerActive = isTimerActive(timerId);

  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStartX(e.touches[0].clientX);
    setSwipeDelta(0);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeStartX !== null) {
      const dx = e.touches[0].clientX - swipeStartX;
      setSwipeDelta(dx);
    }
  };
  const handleTouchEnd = () => {
    if (swipeDelta > 100) {
      playCompleteAnimation();
    }
    setSwipeStartX(null);
    setSwipeDelta(0);
  };

  const playCompleteAnimation = () => {
    setJustCompleted(true);
    // Mark explicit set end time for duration tracking
    setSetEndTime(exerciseName, setNumber);
    setTimeout(() => {
      setJustCompleted(false);
      onComplete();
      if (onAutoAdvanceNext) setTimeout(onAutoAdvanceNext, 300);
    }, 400);
  };

  const handleRestTimerComplete = () => {
    // Timer continues running past target time - no auto-stop
    // This callback is only for UI feedback (sounds, notifications, etc.)
    if (onRestTimerComplete) {
      onRestTimerComplete();
    }
  };

  const handleRestTimeTracked = (actualRestTime: number) => {
    if (restTime && actualRestTime > 0) {
      console.log(`⏱️ Rest time tracked for ${exerciseName} set ${setNumber}: ${actualRestTime}s (planned: ${restTime}s)`);
      
      logRestTime({
        exerciseName,
        plannedRestTime: restTime,
        actualRestTime,
        // Note: workoutId would need to be passed down as a prop for full analytics
      });
      
      // IMPORTANT: Update the actual set's rest time with measured time
      // This ensures the saved workout has accurate rest time data
      if (onRestTimeChange) {
        onRestTimeChange({
          target: { value: actualRestTime.toString() }
        } as React.ChangeEvent<HTMLInputElement>);
      }
      
      // Log timing validation
      const discrepancy = Math.abs(actualRestTime - restTime);
      if (discrepancy > 15) {
        console.warn(`⚠️ Significant rest time discrepancy: ${discrepancy}s difference from planned`);
      }
    }
  };

  const completedAnim = justCompleted
    ? "animate-[pulse_0.4s_ease-in-out] ring-2 ring-green-500 shadow-lg transition-all"
    : "";

  return (
    <div
      ref={rowRef}
      className={`relative ${isEditing ? "py-2" : "py-3"} border-b border-gray-800 transition-all duration-200 touch-pan-x select-none ${completedAnim}`}
      onTouchStart={!isEditing && !completed ? handleTouchStart : undefined}
      onTouchMove={!isEditing && !completed ? handleTouchMove : undefined}
      onTouchEnd={!isEditing && !completed ? handleTouchEnd : undefined}
      style={{
        transform: swipeDelta > 0 ? `translateX(${swipeDelta}px)` : undefined,
        transition: swipeDelta === 0 ? "transform 0.15s" : undefined,
        background:
          justCompleted
            ? "linear-gradient(90deg, rgba(16,185,129,0.15) 0%, rgba(59,130,246,0.07) 100%)"
            : undefined,
        zIndex: justCompleted ? 20 : undefined,
      }}
    >
      {isEditing ? (
        <div className="grid grid-cols-12 gap-2 items-center">
          <button
            onClick={() => {
              handleFirstInteraction();
              onWarmupToggle?.();
            }}
            className={cn(
              "col-span-1 text-center font-medium transition-all duration-200 hover:scale-110 cursor-pointer select-none",
              isWarmup
                ? "text-orange-400 bg-orange-400/20 rounded-full px-2 py-1"
                : "text-gray-400 hover:text-orange-400"
            )}
          >
            {isWarmup ? "W" : `#${setNumber}`}
          </button>
          <div className="col-span-4 flex items-center gap-1 min-w-0">
            <button
              type="button"
              onClick={() => {
                handleFirstInteraction();
                onWeightIncrement(-1);
              }}
              className="h-11 w-11 flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 rounded-full"
            >
              <MinusCircle size={isMobile ? 20 : 18} />
            </button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={weight}
                    onFocus={handleFirstInteraction}
                    onChange={(e) => {
                      handleFirstInteraction();
                      onWeightChange(e);
                      updateWeight(Number(e.target.value));
                    }}
                    className={cn(
                      "workout-number-input text-center value-text px-1 py-2 w-full min-w-0",
                      isAutoWeight && "italic text-gray-400"
                    )}
                    placeholder={isIsometric ? "Optional weight" : "Weight"}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {isAutoWeight ? `Auto-calculated from bodyweight (${userWeight}kg)` : "Manual weight"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <button
              type="button"
              onClick={() => {
                handleFirstInteraction();
                onWeightIncrement(1);
              }}
              className="h-11 w-11 flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 rounded-full"
            >
              <PlusCircle size={isMobile ? 20 : 18} />
            </button>
          </div>
          <div className="col-span-4 flex items-center gap-1 min-w-0">
            {isIsometric ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    handleFirstInteraction();
                    onDurationIncrement?.(-5);
                  }}
                  className="h-11 w-11 flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 rounded-full"
                >
                  <MinusCircle size={isMobile ? 20 : 18} />
                </button>
                <Input 
                  type="number"
                  min="0"
                  step="5"
                  value={duration}
                  onChange={onDurationChange}
                  className="workout-number-input text-center value-text px-1 py-2 w-full min-w-0"
                  placeholder="Duration (seconds)"
                />
                <button
                  type="button"
                  onClick={() => {
                    handleFirstInteraction();
                    onDurationIncrement?.(5);
                  }}
                  className="h-11 w-11 flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 rounded-full"
                >
                  <PlusCircle size={isMobile ? 20 : 18} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    handleFirstInteraction();
                    onRepsIncrement(-1);
                  }}
                  className="h-11 w-11 flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 rounded-full"
                >
                  <MinusCircle size={isMobile ? 20 : 18} />
                </button>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={reps}
                  onFocus={handleFirstInteraction}
                  onChange={(e) => {
                    handleFirstInteraction();
                    onRepsChange(e);
                  }}
                  className="workout-number-input text-center value-text px-1 py-2 w-full min-w-0"
                  placeholder="Reps"
                />
                <button
                  type="button"
                  onClick={() => {
                    handleFirstInteraction();
                    onRepsIncrement(1);
                  }}
                  className="h-11 w-11 flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 rounded-full"
                >
                  <PlusCircle size={isMobile ? 20 : 18} />
                </button>
              </>
            )}
          </div>
          <div className="col-span-3 flex items-center gap-1 min-w-0">
            {onRestTimeIncrement && (
              <button 
                type="button"
                onClick={() => handleRestTimeIncrement(-5)} 
                className="h-11 w-11 flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 rounded-full"
              >
                <MinusCircle size={isMobile ? 20 : 18} />
              </button>
            )}
            <Input 
              type="number"
              min="0"
              step="5"
              value={restTime || 60}
              onChange={handleManualRestTimeChange}
              disabled={!onRestTimeChange}
              className="workout-number-input text-center value-text px-1 py-2 w-full min-w-0"
              onBlur={(e) => {
                if (parseInt(e.target.value) < 0 || e.target.value === '') {
                  if (onRestTimeChange) {
                    handleManualRestTimeChange({
                      target: { value: "0" }
                    } as React.ChangeEvent<HTMLInputElement>);
                  }
                }
              }}
            />
            {onRestTimeIncrement && (
              <button 
                type="button"
                onClick={() => handleRestTimeIncrement(5)} 
                className="h-11 w-11 flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 rounded-full"
              >
                <PlusCircle size={isMobile ? 20 : 18} />
              </button>
            )}
          </div>
          <div className="col-span-12 flex justify-end gap-2 mt-2">
            <Button
              size="icon"
              onClick={onSave}
              className="h-11 w-11 bg-blue-600/70 text-blue-100 hover:bg-blue-600"
            >
              <Save size={isMobile ? 20 : 18} />
            </Button>
            <Button
              size="icon"
              onClick={onRemove}
              className="h-11 w-11 bg-red-600/70 text-red-100 hover:bg-red-600"
            >
              <Trash2 size={isMobile ? 20 : 18} />
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-1 items-center px-1">
          <button
            onClick={() => {
              handleFirstInteraction();
              onWarmupToggle?.();
            }}
            className={cn(
              "col-span-1 text-center font-medium transition-all duration-200 hover:scale-110 cursor-pointer select-none",
              isWarmup
                ? "text-orange-400 bg-orange-400/20 rounded-full px-1 py-1 text-xs"
                : "text-gray-400 hover:text-orange-400"
            )}
          >
            {isWarmup ? "W" : `#${setNumber}`}
          </button>
          <div className="col-span-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      "flex flex-col items-center px-1 py-2 rounded min-h-[44px] hover:bg-gray-800/70 cursor-pointer transition-all duration-200",
                      isAutoWeight && "italic text-gray-400",
                      "value-text"
                    )}
                    onClick={() => {
                      handleFirstInteraction();
                      onEdit();
                    }}
                  >
                    <span className="font-mono font-semibold text-white text-sm">
                      {displayWeight}
                    </span>
                    <span className="text-xs text-gray-300">{globalWeightUnit}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {isAutoWeight ? `Auto-calculated from bodyweight (${userWeight}kg)` : "Manual weight"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="col-span-2">
            <div 
              className="flex flex-col items-center px-1 py-2 rounded min-h-[44px] hover:bg-gray-800/70 cursor-pointer transition-all duration-200"
              onClick={() => {
                handleFirstInteraction();
                onEdit();
              }}
            >
              {isIsometric ? (
                <span className="text-xs text-white/90 value-text text-center">
                  {duration > 0 ? formatDuration(duration) : "Not set"}
                </span>
              ) : (
                <>
                  <span className="font-mono font-semibold text-white text-sm">{reps}</span>
                  <span className="text-xs text-gray-300">reps</span>
                </>
              )}
            </div>
          </div>
          <div className="col-span-2 flex flex-col items-center text-gray-400 px-1">
            <Timer size={14} className="text-purple-400" />
            {(() => {
              const label = getDisplayRestLabelByIndex(restTime, setNumber - 1);
              if (label.type === 'start') {
                return (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 mt-0.5">
                    Start
                  </span>
                );
              }
              return (
                <span className="font-mono text-xs text-white">
                  {formatRestForDisplay(label)}
                </span>
              );
            })()}
          </div>
          <div className="col-span-5 flex justify-center gap-1">
            {completed ? (
              <Button
                size="icon"
                onClick={() => {
                  handleFirstInteraction();
                  onEdit();
                }}
                className="h-11 w-11 bg-gray-700 text-gray-300 hover:bg-gray-600"
              >
                <Edit size={20} />
              </Button>
            ) : (
              <Button 
                size="icon"
                onClick={handleSetComplete}
                className="h-11 w-11 bg-gray-800 text-gray-400 hover:bg-green-700 hover:text-white transform transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Check size={20} />
              </Button>
            )}
            <Button
              size="icon"
              onClick={onRemove}
              className="h-11 w-11 bg-gray-700 text-gray-300 hover:bg-red-700 hover:text-white"
            >
              <Trash2 size={20} />
            </Button>
          </div>
        </div>
      )}
      {justCompleted && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="rounded-full bg-green-500/90 flex items-center justify-center px-10 py-3 shadow-xl animate-fade-in">
            <Check size={32} className="text-white animate-scale-in" />
            <span className="ml-3 text-white font-bold text-lg animate-scale-in">Set Complete!</span>
          </div>
        </div>
      )}
      
      {/* Compact Rest Timer - Shows when set is completed and rest timer is active */}
      {completed && restTimerActive && (
        <div className="mt-3 px-2">
          <CompactRestTimer
            timerId={timerId}
            targetTime={restTime || 60}
            onComplete={handleRestTimerComplete}
            onRestTimeTracked={handleRestTimeTracked}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};
