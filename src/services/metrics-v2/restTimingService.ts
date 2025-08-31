// Phase 2: Rest Timing Service - Single Source of Truth Implementation
// This service provides accurate rest timing calculations for Metrics V2

export interface SetTiming {
  id: string;
  workoutId: string;
  exerciseName: string;
  setNumber: number;
  startedAt?: string;
  completedAt?: string;
  restMs?: number;
  timingSource: 'actual' | 'estimated' | 'manual';
  reps: number;
  weight: number;
}

export interface RestTimingResult {
  totalRestMs: number;
  averageRestMs: number;
  restPeriods: number[];
  hasAccurateTiming: boolean;
  dataQuality: 'high' | 'medium' | 'low';
}

export interface WorkoutTimingMetrics {
  workoutId: string;
  totalWorkTimeMs: number;
  totalRestTimeMs: number;
  workRestRatio: number;
  densityKgPerMin: number;
  avgRestBetweenSets: number;
  timingQuality: 'high' | 'medium' | 'low';
}

/**
 * Fixed rest timing calculation service implementing proper logic:
 * rest[n] = T_start(n+1) - T_complete(n)
 */
export class RestTimingService {
  
  /**
   * Calculate accurate rest times using proper timing logic
   */
  static calculateRestTimes(sets: SetTiming[]): RestTimingResult {
    console.debug('[rest-timing.calculate]', {
      totalSets: sets.length,
      hasStartTimes: sets.filter(s => s.startedAt).length,
      hasCompleteTimes: sets.filter(s => s.completedAt).length
    });

    // Sort sets by completion time or set number
    const orderedSets = [...sets].sort((a, b) => {
      const timeA = new Date(a.completedAt || a.startedAt || 0).getTime();
      const timeB = new Date(b.completedAt || b.startedAt || 0).getTime();
      return timeA - timeB || a.setNumber - b.setNumber;
    });

    const restPeriods: number[] = [];
    let actualTimingCount = 0;

    for (let i = 0; i < orderedSets.length - 1; i++) {
      const currentSet = orderedSets[i];
      const nextSet = orderedSets[i + 1];

      // ✅ CORRECT TIMING LOGIC: rest = start(n+1) - complete(n)
      if (currentSet.completedAt && nextSet.startedAt) {
        const completedTime = new Date(currentSet.completedAt).getTime();
        const startedTime = new Date(nextSet.startedAt).getTime();
        const restMs = startedTime - completedTime;

        if (restMs >= 0 && restMs < 30 * 60 * 1000) { // Cap at 30 minutes
          restPeriods.push(restMs);
          actualTimingCount++;
          console.debug('[rest-timing.calculated]', {
            fromSet: i + 1,
            toSet: i + 2,
            restSeconds: Math.round(restMs / 1000),
            completedAt: currentSet.completedAt,
            startedAt: nextSet.startedAt
          });
        }
      } else {
        // Fallback to stored rest_time if available
        if (nextSet.restMs && nextSet.restMs > 0) {
          restPeriods.push(nextSet.restMs);
        }
      }
    }

    const totalRestMs = restPeriods.reduce((sum, rest) => sum + rest, 0);
    const averageRestMs = restPeriods.length > 0 ? totalRestMs / restPeriods.length : 0;
    
    // Determine data quality based on timing accuracy
    const timingAccuracy = actualTimingCount / Math.max(1, orderedSets.length - 1);
    let dataQuality: 'high' | 'medium' | 'low' = 'low';
    
    if (timingAccuracy >= 0.8) dataQuality = 'high';
    else if (timingAccuracy >= 0.5) dataQuality = 'medium';

    console.debug('[rest-timing.result]', {
      totalRestMs,
      averageRestSeconds: Math.round(averageRestMs / 1000),
      dataQuality,
      timingAccuracy: Math.round(timingAccuracy * 100) + '%'
    });

    return {
      totalRestMs,
      averageRestMs,
      restPeriods,
      hasAccurateTiming: actualTimingCount > 0,
      dataQuality
    };
  }

  /**
   * Calculate comprehensive workout timing metrics
   */
  static calculateWorkoutMetrics(
    workoutId: string,
    sets: SetTiming[],
    totalVolumeKg: number,
    workoutDurationMs: number
  ): WorkoutTimingMetrics {
    const restResult = this.calculateRestTimes(sets);
    
    // Calculate work time as total workout time minus rest time
    const totalWorkTimeMs = Math.max(0, workoutDurationMs - restResult.totalRestMs);
    
    // Calculate work-rest ratio
    const workRestRatio = restResult.totalRestMs > 0 
      ? totalWorkTimeMs / restResult.totalRestMs 
      : totalWorkTimeMs > 0 ? Infinity : 0;

    // Calculate density (kg per minute)
    const workoutMinutes = workoutDurationMs / (60 * 1000);
    const densityKgPerMin = workoutMinutes > 0 ? totalVolumeKg / workoutMinutes : 0;

    return {
      workoutId,
      totalWorkTimeMs,
      totalRestTimeMs: restResult.totalRestMs,
      workRestRatio,
      densityKgPerMin,
      avgRestBetweenSets: restResult.averageRestMs,
      timingQuality: restResult.dataQuality
    };
  }

  /**
   * Validate timing data integrity
   */
  static validateTimingData(sets: SetTiming[]): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const setsWithStartTimes = sets.filter(s => s.startedAt);
    const setsWithCompleteTimes = sets.filter(s => s.completedAt);

    if (setsWithStartTimes.length === 0) {
      issues.push('No set start times recorded');
      recommendations.push('Implement set start time capture in workout tracking');
    }

    if (setsWithCompleteTimes.length === 0) {
      issues.push('No set completion times recorded');
      recommendations.push('Implement set completion time capture in workout tracking');
    }

    // Check for impossible timing scenarios
    sets.forEach((set, index) => {
      if (set.startedAt && set.completedAt) {
        const startTime = new Date(set.startedAt).getTime();
        const endTime = new Date(set.completedAt).getTime();
        const duration = endTime - startTime;

        if (duration < 0) {
          issues.push(`Set ${index + 1}: completion time before start time`);
        }

        if (duration > 10 * 60 * 1000) { // More than 10 minutes per set
          issues.push(`Set ${index + 1}: unusually long set duration (${Math.round(duration / 1000)}s)`);
        }
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Upgrade legacy rest time data to new timing format
   */
  static upgradeLegacyRestData(sets: Array<{
    id: string;
    workoutId: string;
    exerciseName: string;
    setNumber: number;
    createdAt: string;
    restTime?: number; // Legacy field in seconds
    reps: number;
    weight: number;
  }>): SetTiming[] {
    return sets.map((set, index) => ({
      id: set.id,
      workoutId: set.workoutId,
      exerciseName: set.exerciseName,
      setNumber: set.setNumber,
      startedAt: undefined, // Legacy data doesn't have start times
      completedAt: set.createdAt,
      restMs: set.restTime ? set.restTime * 1000 : undefined,
      timingSource: 'estimated' as const,
      reps: set.reps,
      weight: set.weight
    }));
  }
}

/**
 * Corrected rest calculation function for Metrics V2
 * Replaces the broken deriveRestMs function
 */
export function deriveRestMs(setsInWorkout: SetTiming[]): number[] {
  console.debug('[rest-timing.derive]', {
    setCount: setsInWorkout.length,
    hasTimingData: setsInWorkout.filter(s => s.startedAt || s.completedAt).length
  });

  const result = RestTimingService.calculateRestTimes(setsInWorkout);
  
  // Log audit information
  console.debug('[rest-timing.audit]', {
    totalRestMs: result.totalRestMs,
    averageRestMs: result.averageRestMs,
    dataQuality: result.dataQuality,
    periodsCalculated: result.restPeriods.length
  });

  return result.restPeriods;
}