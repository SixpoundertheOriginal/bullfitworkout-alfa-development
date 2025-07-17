import React, { useState, useEffect, useRef } from 'react';
import { Timer, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface CompactRestTimerProps {
  isActive: boolean;
  targetTime: number;
  onComplete?: () => void;
  onRestTimeTracked?: (actualRestTime: number) => void;
  className?: string;
}

export const CompactRestTimer = ({ 
  isActive, 
  targetTime, 
  onComplete,
  onRestTimeTracked,
  className 
}: CompactRestTimerProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const clearTimerInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTimerInterval = () => {
    startTimeRef.current = Date.now();
    clearTimerInterval();
    
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
        
        if (elapsed >= targetTime && !isCompleted) {
          setIsCompleted(true);
          if (onComplete) {
            onComplete();
          }
        }
        
        // Track overtime
        if (elapsed > targetTime) {
          setIsOvertime(true);
        }
      }
    }, 1000);
  };

  useEffect(() => {
    if (isActive) {
      setElapsedTime(0);
      setIsCompleted(false);
      setIsOvertime(false);
      startTimerInterval();
    } else {
      // Track actual rest time when timer becomes inactive
      if (elapsedTime > 0 && onRestTimeTracked) {
        onRestTimeTracked(elapsedTime);
      }
      clearTimerInterval();
      setElapsedTime(0);
      setIsCompleted(false);
      setIsOvertime(false);
      startTimeRef.current = null;
    }

    return () => {
      clearTimerInterval();
    };
  }, [isActive, targetTime]);

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