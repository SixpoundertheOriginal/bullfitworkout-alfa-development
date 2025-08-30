// Time Period Averages Calculator for metrics-v2 engine
import { addDays, startOfWeek, startOfMonth, format } from 'date-fns';

export interface TimePeriodAveragesInput {
  workouts: Array<{
    id: string;
    startedAt: string;
    duration?: number;
  }>;
  sets: Array<{
    workoutId: string;
    exerciseName: string;
    weightKg?: number;
    reps?: number;
    seconds?: number;
    isBodyweight?: boolean;
    performedAt?: string;
    restMs?: number;
    isWarmup?: boolean;
  }>;
  referenceDate: Date;
  timezone?: string;
  bodyweightKg?: number;
}

export interface PeriodAverages {
  averageTonnagePerWorkout: number;
  averageDurationPerWorkout: number; // in minutes
  averageSetsPerWorkout: number;
  averageRepsPerWorkout: number;
  totalWorkouts: number;
  periodLabel: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface TimePeriodAveragesOutput {
  thisWeek: PeriodAverages;
  thisMonth: PeriodAverages;
  last7Days: PeriodAverages;
  last30Days: PeriodAverages;
  allTime: PeriodAverages;
}

export function calculateTimePeriodAverages(
  input: TimePeriodAveragesInput
): TimePeriodAveragesOutput {
  const { workouts, sets, referenceDate, bodyweightKg = 75 } = input;
  
  // Define time periods with timezone-aware calculations
  const timePeriods = {
    thisWeek: {
      startDate: startOfWeek(referenceDate, { weekStartsOn: 1 }), // Monday start
      endDate: referenceDate,
      label: 'This Week'
    },
    thisMonth: {
      startDate: startOfMonth(referenceDate),
      endDate: referenceDate,
      label: 'This Month'
    },
    last7Days: {
      startDate: addDays(referenceDate, -7),
      endDate: referenceDate,
      label: 'Last 7 Days'
    },
    last30Days: {
      startDate: addDays(referenceDate, -30),
      endDate: referenceDate,
      label: 'Last 30 Days'
    },
    allTime: {
      startDate: new Date('2020-01-01'), // Far back date
      endDate: referenceDate,
      label: 'All Time'
    }
  };
  
  // Calculate averages for each period
  const results: TimePeriodAveragesOutput = {} as TimePeriodAveragesOutput;
  
  for (const [periodKey, period] of Object.entries(timePeriods)) {
    results[periodKey as keyof TimePeriodAveragesOutput] = calculatePeriodAverages({
      workouts,
      sets,
      dateRange: period,
      bodyweightKg
    });
  }
  
  return results;
}

function calculatePeriodAverages({
  workouts,
  sets,
  dateRange,
  bodyweightKg
}: {
  workouts: TimePeriodAveragesInput['workouts'];
  sets: TimePeriodAveragesInput['sets'];
  dateRange: { startDate: Date; endDate: Date; label: string };
  bodyweightKg: number;
}): PeriodAverages {
  // Filter workouts to period
  const periodWorkouts = workouts.filter(workout => {
    const workoutDate = new Date(workout.startedAt);
    return workoutDate >= dateRange.startDate && workoutDate <= dateRange.endDate;
  });
  
  if (periodWorkouts.length === 0) {
    return {
      averageTonnagePerWorkout: 0,
      averageDurationPerWorkout: 0,
      averageSetsPerWorkout: 0,
      averageRepsPerWorkout: 0,
      totalWorkouts: 0,
      periodLabel: dateRange.label,
      dateRange: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }
    };
  }
  
  const workoutIds = new Set(periodWorkouts.map(w => w.id));
  const periodSets = sets.filter(set => 
    workoutIds.has(set.workoutId) && 
    !set.isWarmup &&
    set.reps !== null &&
    set.reps !== undefined &&
    set.reps > 0
  );
  
  // Calculate totals
  const totalTonnage = periodSets.reduce((sum, set) => {
    const weight = set.weightKg || 0;
    const reps = set.reps || 0;
    
    // Handle bodyweight exercises - use bodyweight if no weight specified
    const effectiveWeight = weight > 0 ? weight : (set.isBodyweight ? bodyweightKg : 0);
    return sum + (effectiveWeight * reps);
  }, 0);
  
  const totalDuration = periodWorkouts.reduce((sum, workout) => {
    return sum + (workout.duration || 0);
  }, 0);
  
  const totalSets = periodSets.length;
  const totalReps = periodSets.reduce((sum, set) => sum + (set.reps || 0), 0);
  
  // Calculate averages
  const workoutCount = periodWorkouts.length;
  
  return {
    averageTonnagePerWorkout: Math.round(totalTonnage / workoutCount),
    averageDurationPerWorkout: Math.round((totalDuration / workoutCount) / 60), // Convert to minutes
    averageSetsPerWorkout: Math.round(totalSets / workoutCount),
    averageRepsPerWorkout: Math.round(totalReps / workoutCount),
    totalWorkouts: workoutCount,
    periodLabel: dateRange.label,
    dateRange: {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    }
  };
}