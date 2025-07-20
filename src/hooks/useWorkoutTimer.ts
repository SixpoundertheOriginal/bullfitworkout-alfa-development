
import { useEffect } from 'react';
import { useWorkoutStore } from '@/store/workoutStore';

export function useWorkoutTimer() {
  const { isActive, isPaused, setElapsedTime } = useWorkoutStore();

  // Timer effect to update elapsed time
  useEffect(() => {
    if (isActive && !isPaused) {
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isActive, isPaused, setElapsedTime]);

  return { isActive, isPaused };
}
