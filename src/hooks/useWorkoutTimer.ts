
import { useEffect } from 'react';
import { useWorkoutStore } from '@/store/workoutStore';

export function useWorkoutTimer() {
  const { isActive, isPaused, startTime, pausedAt, totalPausedMs, setElapsedTime } = useWorkoutStore();

  // Timer effect to update elapsed time based on wall-clock minus paused durations
  useEffect(() => {
    if (!isActive || !startTime) return;

    const compute = () => {
      const now = Date.now();
      const startMs = new Date(startTime).getTime();
      const pausedMs = (totalPausedMs || 0) + ((isPaused && pausedAt) ? (now - pausedAt) : 0);
      const seconds = Math.max(0, Math.floor((now - startMs - pausedMs) / 1000));
      setElapsedTime(seconds);
    };

    // initial snap and interval
    compute();
    const timer = setInterval(compute, 1000);
    return () => clearInterval(timer);
  }, [isActive, startTime, isPaused, pausedAt, totalPausedMs, setElapsedTime]);

  return { isActive, isPaused };
}
