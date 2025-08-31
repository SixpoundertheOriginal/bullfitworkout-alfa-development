// Fixed Rest Timing Calculations for Metrics V2
// Replaces the broken deriveRestMs function with correct timing logic

import { RestTimingService, type SetTiming } from '../restTimingService';

export interface SetLike {
  workoutId: string;
  exerciseName: string;
  performedAt?: string;
  completedAt?: string;
  startedAt?: string;
  restMs?: number;
  reps: number;
  weightKg: number;
  hasActualTiming: boolean;
}

/**
 * ✅ CORRECTED rest calculation function
 * Implements proper timing logic: rest[n] = T_start(n+1) - T_complete(n)
 */
export function deriveRestMs(setsInWorkout: SetLike[]): number[] {
  console.debug('[rest-calc.derive]', {
    setCount: setsInWorkout.length,
    hasTimingData: setsInWorkout.filter(s => s.startedAt || s.completedAt).length
  });

  // Convert to RestTimingService format
  const timingSets: SetTiming[] = setsInWorkout.map((set, index) => ({
    id: `${set.workoutId}-${index}`,
    workoutId: set.workoutId,
    exerciseName: set.exerciseName,
    setNumber: index + 1,
    startedAt: set.startedAt,
    completedAt: set.completedAt || set.performedAt,
    restMs: set.restMs,
    timingSource: (set.startedAt && set.completedAt) ? 'actual' : 'estimated',
    reps: set.reps,
    weight: set.weightKg
  }));

  // Use the corrected timing calculation
  const result = RestTimingService.calculateRestTimes(timingSets);
  
  console.debug('[rest-calc.result]', {
    periodsCalculated: result.restPeriods.length,
    totalRestMs: result.totalRestMs,
    averageRestSec: Math.round(result.averageRestMs / 1000),
    dataQuality: result.dataQuality
  });

  return result.restPeriods;
}

/**
 * Calculate rest time coverage percentage for data quality assessment
 */
export function calculateRestCoverage(setsInWorkout: SetLike[]): {
  coveragePercent: number;
  calculatedPeriods: number;
  totalPossiblePeriods: number;
  hasAccurateTiming: boolean;
} {
  const restPeriods = deriveRestMs(setsInWorkout);
  const totalPossiblePeriods = Math.max(0, setsInWorkout.length - 1);
  
  const coveragePercent = totalPossiblePeriods > 0 
    ? (restPeriods.length / totalPossiblePeriods) * 100 
    : 0;

  const hasAccurateTiming = setsInWorkout.some(s => 
    s.startedAt && s.completedAt && s.startedAt !== s.completedAt
  );

  return {
    coveragePercent,
    calculatedPeriods: restPeriods.length,
    totalPossiblePeriods,
    hasAccurateTiming
  };
}

/**
 * Enhanced rest analytics with timing quality indicators
 */
export function calculateRestAnalytics(setsInWorkout: SetLike[]): {
  totalRestMs: number;
  averageRestMs: number;
  medianRestMs: number;
  restVariability: number;
  dataQuality: 'high' | 'medium' | 'low';
  timingSource: 'actual' | 'estimated' | 'mixed';
} {
  const restPeriods = deriveRestMs(setsInWorkout);
  
  if (restPeriods.length === 0) {
    return {
      totalRestMs: 0,
      averageRestMs: 0,
      medianRestMs: 0,
      restVariability: 0,
      dataQuality: 'low',
      timingSource: 'estimated'
    };
  }

  const totalRestMs = restPeriods.reduce((sum, rest) => sum + rest, 0);
  const averageRestMs = totalRestMs / restPeriods.length;
  
  // Calculate median
  const sortedRests = [...restPeriods].sort((a, b) => a - b);
  const medianRestMs = sortedRests.length % 2 === 0
    ? (sortedRests[sortedRests.length / 2 - 1] + sortedRests[sortedRests.length / 2]) / 2
    : sortedRests[Math.floor(sortedRests.length / 2)];

  // Calculate variability (coefficient of variation)
  const variance = restPeriods.reduce((sum, rest) => sum + Math.pow(rest - averageRestMs, 2), 0) / restPeriods.length;
  const standardDeviation = Math.sqrt(variance);
  const restVariability = averageRestMs > 0 ? (standardDeviation / averageRestMs) * 100 : 0;

  // Determine data quality and timing source
  const actualTimingCount = setsInWorkout.filter(s => s.startedAt && s.completedAt).length;
  const timingAccuracy = actualTimingCount / Math.max(1, setsInWorkout.length);
  
  let dataQuality: 'high' | 'medium' | 'low' = 'low';
  if (timingAccuracy >= 0.8) dataQuality = 'high';
  else if (timingAccuracy >= 0.5) dataQuality = 'medium';

  let timingSource: 'actual' | 'estimated' | 'mixed' = 'estimated';
  if (actualTimingCount === setsInWorkout.length) timingSource = 'actual';
  else if (actualTimingCount > 0) timingSource = 'mixed';

  return {
    totalRestMs,
    averageRestMs,
    medianRestMs,
    restVariability,
    dataQuality,
    timingSource
  };
}