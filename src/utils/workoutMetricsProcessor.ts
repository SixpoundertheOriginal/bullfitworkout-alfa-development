// Keep existing code imports

import { ExerciseSet } from '@/types/exercise';
import { calculateEffectiveWeight, getExerciseLoadFactor, isBodyweightExercise } from '@/types/exercise';

// Enhanced ProcessedWorkoutMetrics with advanced efficiency metrics
export interface ProcessedWorkoutMetrics {
  duration: number;
  exerciseCount: number;
  setCount: {
    total: number;
    completed: number;
    failed: number;
  };
  totalVolume: number;
  adjustedVolume: number;
  intensity: number;
  density: number;
  efficiency: number;
  densityMetrics: {
    setsPerMinute: number;
    volumePerMinute: number;
    overallDensity: number;
    activeOnlyDensity: number;
    formattedOverallDensity: string;
    formattedActiveOnlyDensity: string;
  };
  intensityMetrics: {
    averageRpe: number;
    peakLoad: number;
    averageLoad: number;
  };
  // Enhanced efficiency metrics
  efficiencyMetrics: {
    workToRestRatio: number;
    movementEfficiency: number;
    recoveryEfficiency: number;
    paceConsistency: number;
    volumePerActiveMinute: number;
    efficiencyScore: number; // 0-100 composite score
    formattedWorkToRestRatio: string;
  };
  muscleFocus: Record<string, number>;
  estimatedEnergyExpenditure: number;
  movementPatterns: Record<string, number>;
  composition: {
    compound: { count: number; percentage: number };
    isolation: { count: number; percentage: number };
    bodyweight: { count: number; percentage: number };
    isometric: { count: number; percentage: number };
    totalExercises: number;
  };
  timeDistribution: {
    activeTime: number;
    restTime: number;
    activeTimePercentage: number;
    restTimePercentage: number;
    averageRestPeriod: number;
    restVariability: number;
  };
  durationByTimeOfDay: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
}

// Optional workout timing information
interface WorkoutTiming {
  start_time?: string;
  duration: number;
}

// Helper function to categorize time of day
function categorizeTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

// Enhanced main function to process workout metrics with efficiency calculations
export const processWorkoutMetrics = (
  exercises: Record<string, ExerciseSet[]>,
  duration: number,
  weightUnit: 'kg' | 'lb' = 'kg',
  userBodyInfo?: { weight: number; unit: string },
  workoutTiming?: WorkoutTiming
): ProcessedWorkoutMetrics => {
  // Initialize metrics with enhanced efficiency structure
  const metrics: ProcessedWorkoutMetrics = {
    duration,
    exerciseCount: 0,
    setCount: {
      total: 0,
      completed: 0,
      failed: 0,
    },
    totalVolume: 0,
    adjustedVolume: 0,
    intensity: 0,
    density: 0,
    efficiency: 0,
    densityMetrics: {
      setsPerMinute: 0,
      volumePerMinute: 0,
      overallDensity: 0,
      activeOnlyDensity: 0,
      formattedOverallDensity: '0.0 kg/min',
      formattedActiveOnlyDensity: '0.0 kg/min'
    },
    intensityMetrics: {
      averageRpe: 0,
      peakLoad: 0,
      averageLoad: 0,
    },
    efficiencyMetrics: {
      workToRestRatio: 0,
      movementEfficiency: 0,
      recoveryEfficiency: 0,
      paceConsistency: 0,
      volumePerActiveMinute: 0,
      efficiencyScore: 0,
      formattedWorkToRestRatio: '0:1'
    },
    muscleFocus: {},
    estimatedEnergyExpenditure: 0,
    movementPatterns: {},
    composition: {
      compound: { count: 0, percentage: 0 },
      isolation: { count: 0, percentage: 0 },
      bodyweight: { count: 0, percentage: 0 },
      isometric: { count: 0, percentage: 0 },
      totalExercises: 0
    },
    timeDistribution: {
      activeTime: 0,
      restTime: 0,
      activeTimePercentage: 0,
      restTimePercentage: 0,
      averageRestPeriod: 0,
      restVariability: 0
    },
    durationByTimeOfDay: {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0
    }
  };

  // If no exercises or duration, return initialized metrics
  if (!exercises || duration <= 0) {
    return metrics;
  }

  // Convert user weight to kg for consistent calculations if provided
  const userWeightKg = userBodyInfo 
    ? userBodyInfo.unit === 'lb' 
      ? userBodyInfo.weight * 0.453592 
      : userBodyInfo.weight
    : 70;

  // Track exercise data for processing
  const exerciseNames = Object.keys(exercises);
  metrics.exerciseCount = exerciseNames.length;

  let totalRpe = 0;
  let rpeCount = 0;
  let peakLoad = 0;
  let totalLoad = 0;
  let totalReps = 0;
  
  // Initialize composition counters
  let compoundCount = 0;
  let isolationCount = 0;
  let bodyweightCount = 0;
  let isometricCount = 0;
  let totalRestTime = 0;
  let totalActiveTime = 0;

  // Enhanced efficiency tracking
  const restPeriods: number[] = [];
  const setVolumes: number[] = [];
  const exerciseTransitions: number[] = [];

  // Process each exercise
  exerciseNames.forEach(exerciseName => {
    const sets = exercises[exerciseName];
    if (!sets || sets.length === 0) return;

    metrics.setCount.total += sets.length;

    // Determine exercise type for composition
    if (exerciseName.toLowerCase().includes('plank') || 
        exerciseName.toLowerCase().includes('hold') || 
        exerciseName.toLowerCase().includes('isometric')) {
      isometricCount++;
    } else if (exerciseName.toLowerCase().includes('push-up') || 
               exerciseName.toLowerCase().includes('pull-up') || 
               exerciseName.toLowerCase().includes('bodyweight')) {
      bodyweightCount++;
    } else if (exerciseName.toLowerCase().includes('bench') || 
               exerciseName.toLowerCase().includes('squat') || 
               exerciseName.toLowerCase().includes('deadlift') || 
               exerciseName.toLowerCase().includes('press')) {
      compoundCount++;
    } else {
      isolationCount++;
    }
    
    // Calculate rest time and active time with enhanced efficiency tracking
    let exerciseRestTime = 0;

    // Process each set in the exercise
    sets.forEach((set, setIndex) => {
      if (set.completed) {
        metrics.setCount.completed += 1;
        
        // Calculate volume (weight x reps)
        const standardVolume = set.weight * set.reps;
        metrics.totalVolume += standardVolume;
        setVolumes.push(standardVolume);

        // Handle adjusted volume for bodyweight exercises
        if (set.weightCalculation?.isAuto && userBodyInfo) {
          const effectiveWeight = set.weightCalculation.value;
          const adjustedVolume = effectiveWeight * set.reps;
          metrics.adjustedVolume += adjustedVolume;
        } else {
          metrics.adjustedVolume += standardVolume;
        }
        
        // Track RPE if available
        if (set.metadata && typeof set.metadata === 'object' && 'rpe' in set.metadata) {
          const rpe = Number(set.metadata.rpe);
          if (!isNaN(rpe) && rpe > 0) {
            totalRpe += rpe;
            rpeCount++;
          }
        }
        
        // Track peak and total load
        const currentLoad = set.weight;
        peakLoad = Math.max(peakLoad, currentLoad);
        totalLoad += currentLoad;
        totalReps += set.reps;
      } else {
        metrics.setCount.failed += 1;
      }
      
      // Enhanced rest time tracking for efficiency calculations
      const restTime = set.restTime || 60;
      exerciseRestTime += restTime;
      totalRestTime += restTime;
      restPeriods.push(restTime);
    });

    // Update muscle focus data
    const muscleGroup = getExerciseMainMuscleGroup(exerciseName);
    if (muscleGroup) {
      metrics.muscleFocus[muscleGroup] = (metrics.muscleFocus[muscleGroup] || 0) + sets.length;
    }

    // Update movement pattern data
    const movementPattern = getExerciseMovementPattern(exerciseName);
    if (movementPattern) {
      metrics.movementPatterns[movementPattern] = 
        (metrics.movementPatterns[movementPattern] || 0) + sets.length;
    }
  });

  // Enhanced time distribution calculations
  const totalRestTimeMinutes = totalRestTime / 60;
  const totalActiveTimeMinutes = Math.max(0, duration - totalRestTimeMinutes);
  
  // Calculate rest period statistics
  const averageRestPeriod = restPeriods.length > 0 ? 
    restPeriods.reduce((sum, rest) => sum + rest, 0) / restPeriods.length : 0;
  
  const restVariance = restPeriods.length > 1 ? 
    restPeriods.reduce((sum, rest) => sum + Math.pow(rest - averageRestPeriod, 2), 0) / (restPeriods.length - 1) : 0;
  const restVariability = Math.sqrt(restVariance) / averageRestPeriod;

  metrics.timeDistribution = {
    activeTime: totalActiveTimeMinutes,
    restTime: totalRestTimeMinutes,
    activeTimePercentage: (totalActiveTimeMinutes / duration) * 100,
    restTimePercentage: (totalRestTimeMinutes / duration) * 100,
    averageRestPeriod: averageRestPeriod / 60, // Convert to minutes
    restVariability: isNaN(restVariability) ? 0 : restVariability
  };

  // Enhanced efficiency metrics calculations
  const workToRestRatio = totalRestTimeMinutes > 0 ? totalActiveTimeMinutes / totalRestTimeMinutes : 0;
  
  // Movement efficiency: volume per active minute normalized by user weight
  const movementEfficiency = totalActiveTimeMinutes > 0 && userWeightKg > 0 ? 
    (metrics.totalVolume / totalActiveTimeMinutes) / userWeightKg : 0;
  
  // Recovery efficiency: inverse of rest variability (more consistent = more efficient)
  const recoveryEfficiency = restVariability > 0 ? Math.max(0, 1 - Math.min(restVariability, 1)) : 1;
  
  // Pace consistency: coefficient of variation of set volumes (lower = more consistent)
  const averageSetVolume = setVolumes.length > 0 ? 
    setVolumes.reduce((sum, vol) => sum + vol, 0) / setVolumes.length : 0;
  const volumeVariance = setVolumes.length > 1 ? 
    setVolumes.reduce((sum, vol) => sum + Math.pow(vol - averageSetVolume, 2), 0) / (setVolumes.length - 1) : 0;
  const paceConsistency = averageSetVolume > 0 ? 
    Math.max(0, 1 - (Math.sqrt(volumeVariance) / averageSetVolume)) : 0;
  
  // Volume per active minute
  const volumePerActiveMinute = totalActiveTimeMinutes > 0 ? metrics.totalVolume / totalActiveTimeMinutes : 0;
  
  // Composite efficiency score (0-100)
  const efficiencyComponents = [
    Math.min(workToRestRatio / 2, 1) * 25, // Work:rest ratio (optimal around 2:1)
    Math.min(movementEfficiency / 10, 1) * 25, // Movement efficiency
    recoveryEfficiency * 25, // Recovery efficiency
    paceConsistency * 25 // Pace consistency
  ];
  const efficiencyScore = efficiencyComponents.reduce((sum, score) => sum + score, 0);

  metrics.efficiencyMetrics = {
    workToRestRatio,
    movementEfficiency,
    recoveryEfficiency,
    paceConsistency,
    volumePerActiveMinute,
    efficiencyScore,
    formattedWorkToRestRatio: `${workToRestRatio.toFixed(1)}:1`
  };

  // Calculate real intensity and efficiency
  // Intensity = (totalVolume / totalSets) / userWeightKg if sets > 0
  const averageVolumePerSet = metrics.setCount.total > 0 
    ? metrics.totalVolume / metrics.setCount.total 
    : 0;
  metrics.intensity = userWeightKg > 0 
    ? (averageVolumePerSet / userWeightKg) * 100 
    : averageVolumePerSet;

  // Efficiency = (activeTime / totalTime) * 100
  metrics.efficiency = duration > 0 
    ? (totalActiveTimeMinutes / duration) * 100 
    : 0;

  // Calculate density metrics (volume per unit time)
  if (duration > 0) {
    // Use the correct density formulas
    // volumePerMinute = total volume / total duration
    metrics.densityMetrics.volumePerMinute = metrics.totalVolume / duration;
    metrics.densityMetrics.overallDensity = metrics.totalVolume / duration;

    // Density with active time only (excluding rest)
    metrics.densityMetrics.activeOnlyDensity = totalActiveTimeMinutes > 0 ? 
      metrics.totalVolume / totalActiveTimeMinutes : 0;
      
    // Sets per minute remains the same
    metrics.densityMetrics.setsPerMinute = metrics.setCount.completed / duration;
    
    // Legacy density calculation (keeping for backward compatibility)
    metrics.density = (metrics.setCount.completed / duration) * (metrics.totalVolume / 1000);
      
    // Format for display
    const volumeUnit = weightUnit === 'kg' ? 'kg' : 'lb';
    metrics.densityMetrics.formattedOverallDensity = 
      `${metrics.densityMetrics.overallDensity.toFixed(1)} ${volumeUnit}/min`;
    metrics.densityMetrics.formattedActiveOnlyDensity = 
      `${metrics.densityMetrics.activeOnlyDensity.toFixed(1)} ${volumeUnit}/min`;
    
    // Log the calculated density values for debugging
    console.log(`DEBUG - Density calculations:
      - Total Volume: ${metrics.totalVolume} ${weightUnit}
      - Duration: ${duration} minutes
      - Active Time: ${totalActiveTimeMinutes} minutes
      - Rest Time: ${totalRestTimeMinutes} minutes
      - Overall Density: ${metrics.densityMetrics.overallDensity.toFixed(2)} ${weightUnit}/min
      - Active-Only Density: ${metrics.densityMetrics.activeOnlyDensity.toFixed(2)} ${weightUnit}/min
    `);
  }

  // Update time of day distribution 
  if (exercises && Object.keys(exercises).length > 0) {
    // Default to evening if we don't have better data
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'evening';
    
    // First priority: use the workout's start_time if provided via workoutTiming parameter
    if (workoutTiming?.start_time) {
      try {
        const workoutDate = new Date(workoutTiming.start_time);
        timeOfDay = categorizeTimeOfDay(workoutDate);
        console.log(`Using workout start_time (${workoutDate.toLocaleTimeString()}) to determine time of day: ${timeOfDay}`);
      } catch (err) {
        console.error("Error parsing workout start_time:", err);
      }
    } else {
      console.log("No workout start time provided, using default time of day (evening)");
    }
    
    // Assign the full duration to the appropriate time bucket
    metrics.durationByTimeOfDay[timeOfDay] = duration;
  }

  // Calculate composition percentages
  const totalExercises = compoundCount + isolationCount + bodyweightCount + isometricCount;
  
  metrics.composition = {
    compound: { 
      count: compoundCount, 
      percentage: totalExercises > 0 ? (compoundCount / totalExercises) * 100 : 0 
    },
    isolation: { 
      count: isolationCount, 
      percentage: totalExercises > 0 ? (isolationCount / totalExercises) * 100 : 0 
    },
    bodyweight: { 
      count: bodyweightCount, 
      percentage: totalExercises > 0 ? (bodyweightCount / totalExercises) * 100 : 0 
    },
    isometric: { 
      count: isometricCount, 
      percentage: totalExercises > 0 ? (isometricCount / totalExercises) * 100 : 0 
    },
    totalExercises
  };

  // Set intensity metrics
  metrics.intensityMetrics = {
    averageRpe: rpeCount > 0 ? totalRpe / rpeCount : 0,
    peakLoad: peakLoad,
    averageLoad: metrics.setCount.completed > 0 ? totalLoad / metrics.setCount.completed : 0
  };

  // Estimate energy expenditure (very simplified calculation)
  metrics.estimatedEnergyExpenditure = calculateEstimatedEnergyExpenditure(
    metrics.totalVolume,
    duration,
    metrics.exerciseCount,
    userWeightKg
  );

  return metrics;
};

// Helper function to map exercise names to muscle groups (simplified)
const getExerciseMainMuscleGroup = (exerciseName: string): string => {
  const nameLower = exerciseName.toLowerCase();
  
  if (nameLower.includes('bench') || nameLower.includes('chest') || nameLower.includes('pec')) {
    return 'chest';
  } else if (nameLower.includes('squat') || nameLower.includes('leg') || nameLower.includes('quad')) {
    return 'legs';
  } else if (nameLower.includes('dead') || nameLower.includes('back') || nameLower.includes('row')) {
    return 'back';
  } else if (nameLower.includes('shoulder') || nameLower.includes('press') || nameLower.includes('delt')) {
    return 'shoulders';
  } else if (nameLower.includes('bicep') || nameLower.includes('curl')) {
    return 'arms';
  } else if (nameLower.includes('tricep') || nameLower.includes('extension')) {
    return 'arms';
  } else if (nameLower.includes('core') || nameLower.includes('ab')) {
    return 'core';
  }
  
  return 'other';
};

// Helper function to map exercise names to movement patterns (simplified)
const getExerciseMovementPattern = (exerciseName: string): string => {
  const nameLower = exerciseName.toLowerCase();
  
  if (nameLower.includes('bench') || nameLower.includes('push') || nameLower.includes('press')) {
    return 'push';
  } else if (nameLower.includes('row') || nameLower.includes('pull') || nameLower.includes('curl')) {
    return 'pull';
  } else if (nameLower.includes('squat') || nameLower.includes('leg press')) {
    return 'squat';
  } else if (nameLower.includes('dead') || nameLower.includes('hip thrust')) {
    return 'hinge';
  } else if (nameLower.includes('lunge') || nameLower.includes('step')) {
    return 'lunge';
  } else if (nameLower.includes('twist') || nameLower.includes('rotation')) {
    return 'rotation';
  } else if (nameLower.includes('carry') || nameLower.includes('farmer')) {
    return 'carry';
  } else if (nameLower.includes('plank') || nameLower.includes('hold') || nameLower.includes('isometric')) {
    return 'isometric';
  }
  
  return 'other';
};

// Simplified energy expenditure estimation
const calculateEstimatedEnergyExpenditure = (
  totalVolume: number,
  duration: number,
  exerciseCount: number,
  userWeightKg: number
): number => {
  // This is a very simplified formula - in a real app, you'd use more sophisticated models
  // that take into account exercise types, heart rate data if available, etc.
  
  // Basic MET calculation (Metabolic Equivalent of Task)
  // Light strength training: ~3 METs, Vigorous: ~6 METs
  const estimatedMET = 3 + (totalVolume / 10000) + (exerciseCount / 5);
  
  // Calories = MET × weight in kg × time in hours
  const timeInHours = duration / 60;
  const estimatedCalories = estimatedMET * userWeightKg * timeInHours;
  
  return Math.round(estimatedCalories);
};

// Function to estimate effective weight for bodyweight exercises when we don't have rich exercise data
export const estimateBodyweightExerciseLoad = (
  exerciseName: string,
  bodyWeight: number = 70 // Default 70kg if not provided
): number => {
  const nameLower = exerciseName.toLowerCase();
  
  // Common bodyweight exercises and their approximate load factors
  // These are educated estimates - actual values would depend on exact technique, individual biomechanics, etc.
  if (nameLower.includes('push-up') || nameLower.includes('pushup')) {
    return bodyWeight * 0.65; // ~65% of bodyweight
  } else if (nameLower.includes('pull-up') || nameLower.includes('pullup') || 
             nameLower.includes('chin-up') || nameLower.includes('chinup')) {
    return bodyWeight * 1.0; // ~100% of bodyweight
  } else if (nameLower.includes('dip')) {
    return bodyWeight * 1.0; // ~100% of bodyweight
  } else if (nameLower.includes('squat') && !nameLower.includes('weighted')) {
    return bodyWeight * 0.6; // ~60% of bodyweight (for air squats)
  } else if (nameLower.includes('lunge') && !nameLower.includes('weighted')) {
    return bodyWeight * 0.6; // ~60% of bodyweight (for bodyweight lunges)
  } else if (nameLower.includes('plank')) {
    return bodyWeight * 0.6; // ~60% of bodyweight
  } else if (nameLower.includes('sit-up') || nameLower.includes('situp')) {
    return bodyWeight * 0.3; // ~30% of bodyweight
  } else if (nameLower.includes('leg raise')) {
    return bodyWeight * 0.5; // ~50% of bodyweight (for leg portion)
  } else if (nameLower.includes('mountain climber')) {
    return bodyWeight * 0.6; // ~60% of bodyweight
  } else if (nameLower.includes('burpee')) {
    return bodyWeight * 1.0; // ~100% of bodyweight given the explosive component
  }
  
  // Default to 50% of bodyweight if unknown
  return bodyWeight * 0.5;
};
