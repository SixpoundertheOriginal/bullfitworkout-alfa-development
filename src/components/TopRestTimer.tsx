
import React, { useEffect, useRef, useState } from 'react';
import { Timer, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/ui/circular-progress';

interface TopRestTimerProps {
  isActive: boolean;
  onComplete?: () => void;
  resetSignal: number;
  onTimeUpdate?: (time: number) => void;
  onManualStart?: () => void;
  defaultRestTime?: number;
  currentRestTime?: number;
  className?: string; // Added className prop
}

export const TopRestTimer = ({ 
  isActive, 
  onComplete, 
  resetSignal,
  onTimeUpdate,
  onManualStart,
  defaultRestTime = 60,
  currentRestTime,
  className
}: TopRestTimerProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [targetTime] = useState(currentRestTime || defaultRestTime);
  const [targetReached, setTargetReached] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastResetSignalRef = useRef<number>(0);

  const clearTimerInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTimerInterval = () => {
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    clearTimerInterval();
    
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
        
        if (elapsed >= targetTime && !targetReached) {
          setTargetReached(true);
          if (onComplete) {
            onComplete();
          }
        }
        
        if (onTimeUpdate) {
          onTimeUpdate(elapsed);
        }
      }
    }, 1000);
  };

  // This effect handles external reset signals
  useEffect(() => {
    if (resetSignal > 0 && resetSignal !== lastResetSignalRef.current) {
      console.log('TopRestTimer: New reset signal received:', resetSignal);
      lastResetSignalRef.current = resetSignal;
      setElapsedTime(0);
      setTargetReached(false);
      startTimeRef.current = Date.now();
      setIsTimerActive(true);
      startTimerInterval();
    }
  }, [resetSignal, targetTime]);

  // This effect handles the isActive prop changes
  useEffect(() => {
    if (isActive && !isTimerActive) {
      console.log('TopRestTimer: Activating timer from isActive prop');
      setIsTimerActive(true);
      setTargetReached(false);
      setElapsedTime(0);
      startTimeRef.current = Date.now();
      startTimerInterval();
    } else if (!isActive && isTimerActive) {
      console.log('TopRestTimer: Deactivating timer from isActive prop');
      setIsTimerActive(false);
      clearTimerInterval();
      setElapsedTime(0);
      setTargetReached(false);
      startTimeRef.current = null;
    }

    return () => {
      clearTimerInterval();
    };
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = Math.min((elapsedTime / targetTime) * 100, 100);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative">
        <CircularProgress 
          value={progress}
          size={48}
          className={cn(
            "text-purple-500/20",
            isTimerActive && "animate-pulse"
          )}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              "text-sm font-mono",
              targetReached ? "text-orange-400" : "text-gray-200"
            )}>
              {formatTime(elapsedTime)}
            </span>
            <span className="text-[10px] text-gray-400 -mt-0.5">
              / {formatTime(targetTime)}
            </span>
          </div>
        </CircularProgress>
      </div>

      {!isTimerActive && onManualStart && (
        <Button
          variant="outline"
          size="sm"
          onClick={onManualStart}
          className="mt-2 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20 text-purple-300"
        >
          <Play size={12} className="mr-1" /> Start Timer
        </Button>
      )}
    </div>
  );
};
