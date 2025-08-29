import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { aggregatePerWorkout, aggregateTotals, aggregateTotalsKpis } from '../aggregators';
import { WorkoutRaw, SetRaw } from '../types';
import { FEATURE_FLAGS } from '@/config/featureFlags';

// Mock feature flag
const originalFlag = FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED;

describe('aggregators', () => {
  afterEach(() => {
    // Restore original flag value
    (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = originalFlag;
  });

  describe('aggregatePerWorkout', () => {
    const mockWorkouts: WorkoutRaw[] = [
      {
        id: 'workout-1',
        startedAt: '2024-01-01T10:00:00Z',
        duration: 45,
      },
      {
        id: 'workout-2', 
        startedAt: '2024-01-02T10:00:00Z',
        duration: 60,
      },
    ];

    const mockSets: SetRaw[] = [
      {
        id: 'set-1',
        workoutId: 'workout-1',
        weightKg: 100,
        reps: 8,
        exerciseId: 'bench-press',
        restTimeSec: 120,
      },
      {
        id: 'set-2',
        workoutId: 'workout-1', 
        weightKg: 120,
        reps: 6,
        exerciseId: 'deadlift',
        restTimeSec: 180,
      },
      {
        id: 'set-3',
        workoutId: 'workout-2',
        weightKg: 80,
        reps: 10,
        exerciseId: 'squat',
        restTimeSec: 90,
      },
    ];

    it('should aggregate basic metrics correctly', () => {
      const result = aggregatePerWorkout(mockWorkouts, mockSets);
      
      expect(result).toHaveLength(2);
      
      // Workout 1
      expect(result[0]).toMatchObject({
        workoutId: 'workout-1',
        totalSets: 2,
        totalReps: 14,
        totalVolumeKg: 1520, // (100*8) + (120*6)
        durationMin: 45,
        activeMin: 40, // 45min - 5min rest
        restMin: 5, // (120+180)/60
      });

      // Workout 2  
      expect(result[1]).toMatchObject({
        workoutId: 'workout-2',
        totalSets: 1,
        totalReps: 10,
        totalVolumeKg: 800,
        durationMin: 60,
        activeMin: 58.5, // 60min - 1.5min rest
        restMin: 1.5, // 90/60
      });
    });

    it('should include KPIs when feature flag is enabled', () => {
      (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = true;
      
      const result = aggregatePerWorkout(mockWorkouts, mockSets);
      
      expect(result[0].kpis).toBeDefined();
      expect(result[0].kpis).toMatchObject({
        density: 33.78, // 1520/45
        avgRest: 150, // (120+180)/2
        setEfficiency: 1.67, // 150/90
      });
    });

    it('should omit KPIs when feature flag is disabled', () => {
      (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = false;
      
      const result = aggregatePerWorkout(mockWorkouts, mockSets);
      
      expect(result[0].kpis).toBeUndefined();
    });

    it('should handle workouts with no sets', () => {
      const emptyWorkout: WorkoutRaw[] = [{
        id: 'empty-workout',
        startedAt: '2024-01-03T10:00:00Z',
        duration: 30,
      }];
      
      const result = aggregatePerWorkout(emptyWorkout, []);
      
      expect(result[0]).toMatchObject({
        workoutId: 'empty-workout',
        totalSets: 0,
        totalReps: 0,
        totalVolumeKg: 0,
        durationMin: 30,
        activeMin: 30, // Full duration since no rest
        restMin: 0,
      });
    });
  });

  describe('aggregateTotals', () => {
    it('should sum up all workout metrics', () => {
      const perWorkout = [
        {
          workoutId: 'w1',
          startedAt: '2024-01-01T10:00:00Z',
          totalVolumeKg: 1000,
          totalSets: 10,
          totalReps: 50,
          durationMin: 45,
        },
        {
          workoutId: 'w2', 
          startedAt: '2024-01-02T10:00:00Z',
          totalVolumeKg: 1500,
          totalSets: 15,
          totalReps: 75,
          durationMin: 60,
        },
      ];
      
      const result = aggregateTotals(perWorkout);
      
      expect(result).toEqual({
        totalVolumeKg: 2500,
        totalSets: 25,
        totalReps: 125,
        workouts: 2,
        durationMin: 105,
      });
    });
  });

  describe('aggregateTotalsKpis', () => {
    it('should return undefined when feature flag is disabled', () => {
      (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = false;
      
      const result = aggregateTotalsKpis([]);
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty workouts', () => {
      (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = true;
      
      const result = aggregateTotalsKpis([]);
      expect(result).toBeUndefined();
    });

    it('should calculate totals KPIs correctly', () => {
      (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = true;
      
      const perWorkout = [
        {
          workoutId: 'w1',
          startedAt: '2024-01-01T10:00:00Z',
          totalVolumeKg: 2000,
          totalSets: 10,
          totalReps: 50,
          durationMin: 40,
          restMin: 5,
          kpis: {
            density: 50,
            avgRest: 30,
            setEfficiency: 0.8,
          },
        },
        {
          workoutId: 'w2',
          startedAt: '2024-01-02T10:00:00Z', 
          totalVolumeKg: 3000,
          totalSets: 15,
          totalReps: 75,
          durationMin: 60,
          restMin: 10,
          kpis: {
            density: 50,
            avgRest: 40,
            setEfficiency: 1.2,
          },
        },
      ];
      
      const result = aggregateTotalsKpis(perWorkout);
      
      expect(result).toEqual({
        density: 50, // 5000/100
        avgRest: 36, // (5*60 + 10*60) / 25 sets
        setEfficiency: 1, // (0.8 + 1.2) / 2
      });
    });
  });
});