import { useMemo } from 'react';
import { useWorkoutStore } from '@/store/workoutStore';

// Hook to calculate adjusted rest time by subtracting estimated set duration
export const useAdjustedRestTime = (timerId: string, totalInterval: number) => {
  const setTimings = useWorkoutStore((state) => state.setTimings);

  return useMemo(() => {
    // Timer IDs are formatted as `${exercise}_set_${setNumber}`
    const [exerciseId, setPart] = timerId.split('_set_');
    const setKey = `${exerciseId}_${setPart || ''}`;
    const timingData = setTimings.get(setKey);
    const estimatedDuration = timingData?.estimatedDuration || 0; // in seconds
    const adjustedRest = Math.max(totalInterval - estimatedDuration, 0);
    return {
      adjustedRest,
      estimatedDuration,
      hasEstimate: Boolean(estimatedDuration),
    };
  }, [timerId, totalInterval, setTimings]);
};
