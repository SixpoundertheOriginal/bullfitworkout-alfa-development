import React, { useEffect, useRef } from 'react';
import { Timer, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useGlobalRestTimers } from '@/hooks/useGlobalRestTimers';

interface CompactRestTimerProps {
  timerId: string;
  targetTime: number;
  onComplete?: () => void;
  onRestTimeTracked?: (actualRestTime: number) => void;
  className?: string;
}

export const CompactRestTimer = ({ 
  timerId,
  targetTime, 
  onComplete,
  onRestTimeTracked,
  className 
}: CompactRestTimerProps) => {
  const { getTimer, updateTimer, stopTimer, startTimer } = useGlobalRestTimers();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const completedRef = useRef(false);

  const timerState = getTimer(timerId);
  const isActive = timerState?.isActive || false;
  const elapsedTime = timerState?.elapsedTime || 0;
  const isCompleted = timerState?.isCompleted || false;
  const isOvertime = timerState?.isOvertime || false;

  const clearTimerInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTimerInterval = () => {
    clearTimerInterval();
    
    intervalRef.current = setInterval(() => {
      const timer = getTimer(timerId);
      if (timer && timer.isActive && timer.startTime) {
        const now = Date.now();
        const elapsed = Math.floor((now - timer.startTime) / 1000);
        updateTimer(timerId, elapsed);
        
        // Call onComplete when timer reaches target time (only once)
        if (elapsed >= targetTime && !completedRef.current) {
          completedRef.current = true;
          if (onComplete) {
            onComplete();
          }
        }
      }
    }, 1000);
  };

  useEffect(() => {
    if (isActive) {
      completedRef.current = false;
      startTimerInterval();
    } else {
      clearTimerInterval();
      
      // Track actual rest time when timer becomes inactive
      if (elapsedTime > 0 && onRestTimeTracked) {
        onRestTimeTracked(elapsedTime);
      }
    }

    return () => {
      clearTimerInterval();
    };
  }, [isActive, timerId]);

  // Initialize timer if it doesn't exist
  useEffect(() => {
    if (!timerState) {
      startTimer(timerId, targetTime);
    }
  }, [timerId, targetTime, timerState, startTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = Math.min((elapsedTime / targetTime) * 100, 100);
  const remainingTime = Math.max(targetTime - elapsedTime, 0);
  const overtimeSeconds = Math.max(elapsedTime - targetTime, 0);

  if (!isActive) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg",
      "bg-gradient-to-r from-primary/5 to-primary-glow/5",
      "border border-primary/10",
      "animate-fade-in",
      isCompleted && !isOvertime && "from-emerald-500/10 to-emerald-400/10 border-emerald-500/20",
      isOvertime && "from-amber-500/10 to-orange-400/10 border-amber-500/20",
      className
    )}>
      <div className="flex items-center gap-1.5">
        {isCompleted ? (
          <CheckCircle size={14} className="text-emerald-400" />
        ) : (
          <Timer size={14} className="text-primary" />
        )}
        <span className={cn(
          "text-xs font-mono font-medium",
          isCompleted && !isOvertime ? "text-emerald-400" : 
          isOvertime ? "text-amber-400" : "text-primary"
        )}>
          {isCompleted && !isOvertime ? "Ready!" : 
           isOvertime ? `+${formatTime(overtimeSeconds)}` : 
           formatTime(remainingTime)}
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <Progress 
          value={progress} 
          className={cn(
            "h-1.5 bg-muted/50",
            isCompleted && !isOvertime ? "[&>div]:bg-emerald-500" : 
            isOvertime ? "[&>div]:bg-amber-500" :
            "[&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary-glow"
          )}
        />
      </div>
      
      <span className="text-xs text-muted-foreground font-mono">
        {formatTime(targetTime)}
      </span>
    </div>
  );
};