// ✅ CORRECTED Metrics V2 Rest Calculator - Single Source of Truth
// Replaces broken deriveRestMs with accurate timing calculations

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
 * ✅ FIXED: Proper rest calculation using correct timing logic
 * rest[n] = T_start(n+1) - T_complete(n)
 * 
 * This replaces the broken logic that was using completion-to-completion timing
 */
export function deriveRestMs(setsInWorkout: SetLike[]): number[] {
  if (setsInWorkout.length < 2) {
    return [];
  }

  console.debug('[rest-fixed.derive]', {
    setCount: setsInWorkout.length,
    hasStartTimes: setsInWorkout.filter(s => s.startedAt).length,
    hasCompleteTimes: setsInWorkout.filter(s => s.completedAt || s.performedAt).length
  });

  // Sort sets by completion time, then by set order
  const orderedSets = [...setsInWorkout].sort((a, b) => {
    const timeA = new Date(a.completedAt || a.performedAt || 0).getTime();
    const timeB = new Date(b.completedAt || b.performedAt || 0).getTime();
    return timeA - timeB;
  });

  const restPeriods: number[] = [];

  for (let i = 0; i < orderedSets.length - 1; i++) {
    const currentSet = orderedSets[i];
    const nextSet = orderedSets[i + 1];

    // ✅ CORRECT LOGIC: rest = start(n+1) - complete(n)
    const currentCompleteTime = currentSet.completedAt || currentSet.performedAt;
    const nextStartTime = nextSet.startedAt;

    if (currentCompleteTime && nextStartTime) {
      const completeMs = new Date(currentCompleteTime).getTime();
      const startMs = new Date(nextStartTime).getTime();
      const restMs = startMs - completeMs;

      // Validate rest time is reasonable (0-30 minutes)
      if (restMs >= 0 && restMs <= 30 * 60 * 1000) {
        restPeriods.push(restMs);
        console.debug('[rest-fixed.calculated]', {
          fromSet: i + 1,
          toSet: i + 2,
          restSeconds: Math.round(restMs / 1000)
        });
      }
    } else {
      // Fallback to stored rest time if actual timing unavailable
      if (nextSet.restMs && nextSet.restMs > 0) {
        restPeriods.push(nextSet.restMs);
        console.debug('[rest-fixed.fallback]', {
          fromSet: i + 1,
          toSet: i + 2,
          restSeconds: Math.round(nextSet.restMs / 1000)
        });
      }
    }
  }

  console.debug('[rest-fixed.result]', {
    periodsCalculated: restPeriods.length,
    totalRestSec: Math.round(restPeriods.reduce((sum, r) => sum + r, 0) / 1000)
  });

  return restPeriods;
}