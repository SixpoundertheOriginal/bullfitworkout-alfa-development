
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TimerProps {
  duration: number;
  isRunning: boolean;
  onComplete?: () => void;
  onTick?: () => void;
}

export const Timer: React.FC<TimerProps> = ({ duration, isRunning, onComplete, onTick }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    setTimeLeft(duration);
    setProgress(100);
  }, [duration]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(interval);
          if (onComplete) onComplete();
          return 0;
        }
        
        // Call the tick callback if provided
        if (onTick && prevTime % 5 === 0) {
          onTick();
        }
        
        return prevTime - 1;
      });
      
      setProgress((prev) => (timeLeft - 1) / duration * 100);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, duration, timeLeft, onComplete, onTick]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-2">
        <span className={cn(
          "text-4xl font-mono tracking-widest transition-colors",
          timeLeft <= 10 ? "text-red-400" : "text-white"
        )}>
          {formatTime(timeLeft)}
        </span>
      </div>
      <Progress 
        value={progress} 
        max={100} 
        className="h-2 bg-gray-800 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500"
      />
    </div>
  );
};
