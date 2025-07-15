
/**
 * This utility helps transition between the old metrics format and the new format
 * by creating a backward compatible stats object that works with both versions.
 */

interface LegacyStatsFormat {
  totalVolume: number;
  totalExercises: number;
  workoutTypes: any[];
  muscleFocus: Record<string, number>;
  activeTime?: number;
  restTime?: number;
  // Add other fields as needed
}

export const createBackwardCompatibleStats = (metrics: any): LegacyStatsFormat => {
  // Handle the case where metrics is undefined or null
  if (!metrics) {
    return {
      totalVolume: 0,
      totalExercises: 0,
      workoutTypes: [],
      muscleFocus: {},
    };
  }

  // Extract the data we need from the new format
  const totalVolume = metrics.totalVolume || 0;
  const totalExercises = metrics.exerciseCount || 0;
  
  // For workoutTypes and muscleFocus, check if they exist in metrics
  const workoutTypes = Array.isArray(metrics.workoutTypes) 
    ? metrics.workoutTypes 
    : [];
  
  const muscleFocus = metrics.muscleFocus && typeof metrics.muscleFocus === 'object'
    ? metrics.muscleFocus
    : {};
    
  // Add support for time-related metrics from the new format
  const activeTime = metrics.activeTimeMinutes || metrics.timeMetrics?.activeTimeMinutes || 0;
  const restTime = metrics.restTimeMinutes || metrics.timeMetrics?.restTimeMinutes || 0;
    
  // Return a compatible format
  return {
    totalVolume,
    totalExercises,
    workoutTypes,
    muscleFocus,
    activeTime,
    restTime,
    // Add other fields as needed
  };
};
