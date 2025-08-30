import { describe, it, expect } from 'vitest';
import { calculateTimePeriodAverages } from '../calculators/timePeriodAveragesCalculator';
import { addDays, startOfWeek, startOfMonth } from 'date-fns';

describe('TimePeriodAveragesCalculator', () => {
  const referenceDate = new Date('2025-01-15T12:00:00Z'); // Wednesday
  
  const mockWorkouts = [
    { 
      id: 'w1', 
      startedAt: '2025-01-13T10:00:00Z', // This week (Monday)
      duration: 3600 // 60 minutes in seconds
    },
    { 
      id: 'w2', 
      startedAt: '2025-01-10T11:00:00Z', // Last week
      duration: 4800 // 80 minutes in seconds
    },
    { 
      id: 'w3', 
      startedAt: '2025-01-05T12:00:00Z', // This month, different week
      duration: 3000 // 50 minutes in seconds
    }
  ];
  
  const mockSets = [
    // Workout 1 sets
    { workoutId: 'w1', exerciseName: 'Squat', weightKg: 100, reps: 10, isWarmup: false, isBodyweight: false },
    { workoutId: 'w1', exerciseName: 'Squat', weightKg: 100, reps: 8, isWarmup: false, isBodyweight: false },
    // Workout 2 sets
    { workoutId: 'w2', exerciseName: 'Bench', weightKg: 80, reps: 12, isWarmup: false, isBodyweight: false },
    { workoutId: 'w2', exerciseName: 'Bench', weightKg: 80, reps: 10, isWarmup: false, isBodyweight: false },
    // Workout 3 sets
    { workoutId: 'w3', exerciseName: 'Deadlift', weightKg: 90, reps: 15, isWarmup: false, isBodyweight: false }
  ];
  
  it('calculates this week averages correctly', () => {
    const result = calculateTimePeriodAverages({
      workouts: mockWorkouts,
      sets: mockSets,
      referenceDate,
      bodyweightKg: 75
    });
    
    // This week should include only w1 (1 workout)
    expect(result.thisWeek.totalWorkouts).toBe(1);
    expect(result.thisWeek.averageTonnagePerWorkout).toBe(1800); // (100*10 + 100*8) = 1800kg
    expect(result.thisWeek.averageDurationPerWorkout).toBe(60); // 60 minutes
    expect(result.thisWeek.averageSetsPerWorkout).toBe(2); // 2 sets
    expect(result.thisWeek.averageRepsPerWorkout).toBe(18); // 10 + 8 reps
  });
  
  it('calculates this month averages correctly', () => {
    const result = calculateTimePeriodAverages({
      workouts: mockWorkouts,
      sets: mockSets,
      referenceDate,
      bodyweightKg: 75
    });
    
    // This month should include w1 and w3 (2 workouts)
    expect(result.thisMonth.totalWorkouts).toBe(2);
    expect(result.thisMonth.averageTonnagePerWorkout).toBe(1575); // (1800 + 1350) / 2
  });
  
  it('handles bodyweight exercises correctly', () => {
    const bodyweightSets = [
      { workoutId: 'w1', exerciseName: 'Push-ups', weightKg: 0, reps: 15, isWarmup: false, isBodyweight: true },
      { workoutId: 'w1', exerciseName: 'Pull-ups', weightKg: undefined, reps: 10, isWarmup: false, isBodyweight: true }
    ];
    
    const result = calculateTimePeriodAverages({
      workouts: [mockWorkouts[0]],
      sets: bodyweightSets,
      referenceDate,
      bodyweightKg: 75
    });
    
    // Should use bodyweight (75kg) for calculations
    expect(result.thisWeek.averageTonnagePerWorkout).toBe(1875); // 75 * (15 + 10)
  });
  
  it('excludes warmup sets from calculations', () => {
    const setsWithWarmup = [
      { workoutId: 'w1', exerciseName: 'Squat', weightKg: 50, reps: 10, isWarmup: true, isBodyweight: false }, // Warmup - exclude
      { workoutId: 'w1', exerciseName: 'Squat', weightKg: 100, reps: 8, isWarmup: false, isBodyweight: false } // Working set
    ];
    
    const result = calculateTimePeriodAverages({
      workouts: [mockWorkouts[0]],
      sets: setsWithWarmup,
      referenceDate,
      bodyweightKg: 75
    });
    
    // Should only count the working set
    expect(result.thisWeek.averageTonnagePerWorkout).toBe(800); // 100 * 8
    expect(result.thisWeek.averageSetsPerWorkout).toBe(1);
  });
  
  it('returns zeros for periods with no workouts', () => {
    const futureDate = new Date('2025-12-31T12:00:00Z');
    
    const result = calculateTimePeriodAverages({
      workouts: [],
      sets: [],
      referenceDate: futureDate,
      bodyweightKg: 75
    });
    
    expect(result.thisWeek.totalWorkouts).toBe(0);
    expect(result.thisWeek.averageTonnagePerWorkout).toBe(0);
    expect(result.thisWeek.averageDurationPerWorkout).toBe(0);
  });
  
  it('handles last7Days and last30Days correctly', () => {
    const result = calculateTimePeriodAverages({
      workouts: mockWorkouts,
      sets: mockSets,
      referenceDate,
      bodyweightKg: 75
    });
    
    // Last 7 days should include w1 and w2
    expect(result.last7Days.totalWorkouts).toBe(2);
    
    // Last 30 days should include all workouts
    expect(result.last30Days.totalWorkouts).toBe(3);
  });
  
  it('validates period labels are correct', () => {
    const result = calculateTimePeriodAverages({
      workouts: mockWorkouts,
      sets: mockSets,
      referenceDate,
      bodyweightKg: 75
    });
    
    expect(result.thisWeek.periodLabel).toBe('This Week');
    expect(result.thisMonth.periodLabel).toBe('This Month');
    expect(result.last7Days.periodLabel).toBe('Last 7 Days');
    expect(result.last30Days.periodLabel).toBe('Last 30 Days');
    expect(result.allTime.periodLabel).toBe('All Time');
  });
});