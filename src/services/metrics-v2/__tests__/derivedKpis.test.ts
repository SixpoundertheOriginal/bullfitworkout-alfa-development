import { describe, it, expect } from 'vitest';
import {
  calcWorkoutDensityKgPerMin,
  calcAvgRestPerSession,
  calcSetEfficiencyKgPerMin,
  getTargetRestSecForWorkout
} from '../calculators/derivedKpis';

describe('derivedKpis', () => {
  describe('calcWorkoutDensityKgPerMin', () => {
    it('should calculate density correctly for normal workout', () => {
      expect(calcWorkoutDensityKgPerMin(10000, 50)).toBe(200);
    });

    it('should return 0 for zero duration', () => {
      expect(calcWorkoutDensityKgPerMin(10000, 0)).toBe(0);
    });

    it('should return 0 for negative duration', () => {
      expect(calcWorkoutDensityKgPerMin(10000, -10)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      expect(calcWorkoutDensityKgPerMin(1000, 7)).toBe(142.86);
    });
  });

  describe('calcAvgRestPerSession', () => {
    it('should calculate average rest correctly', () => {
      expect(calcAvgRestPerSession(1200, 24)).toBe(50);
    });

    it('should return 0 for zero sets', () => {
      expect(calcAvgRestPerSession(1200, 0)).toBe(0);
    });

    it('should return 0 for negative sets', () => {
      expect(calcAvgRestPerSession(1200, -5)).toBe(0);
    });

    it('should floor the result', () => {
      expect(calcAvgRestPerSession(100, 3)).toBe(33); // 33.33 floored
    });
  });

  describe('calcSetEfficiencyKgPerMin', () => {
    it('should calculate kg per minute correctly', () => {
      expect(calcSetEfficiencyKgPerMin(1000, 50)).toBe(20);
    });

    it('should return 0 for invalid time', () => {
      expect(calcSetEfficiencyKgPerMin(1000, 0)).toBe(0);
    });
  });

  describe('getTargetRestSecForWorkout', () => {
    it('should return default target rest time', () => {
      const workout = {
        workoutId: 'test-1',
        startedAt: '2024-01-01T10:00:00Z',
        totalVolumeKg: 5000,
        totalSets: 20,
        totalReps: 100,
        durationMin: 45,
      };

      expect(getTargetRestSecForWorkout(workout)).toBe(90);
    });
  });
});