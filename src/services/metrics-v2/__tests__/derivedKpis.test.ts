import { describe, it, expect } from 'vitest';
import { 
  calcWorkoutDensityKgPerMin, 
  calcAvgRestPerSession, 
  calcSetEfficiency,
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

  describe('calcSetEfficiency', () => {
    it('should calculate efficiency ratio correctly', () => {
      expect(calcSetEfficiency(75, 90)).toBe(0.83);
    });

    it('should return null for no target', () => {
      expect(calcSetEfficiency(75)).toBe(null);
      expect(calcSetEfficiency(75, undefined)).toBe(null);
    });

    it('should return null for zero target', () => {
      expect(calcSetEfficiency(75, 0)).toBe(null);
    });

    it('should return null for negative target', () => {
      expect(calcSetEfficiency(75, -90)).toBe(null);
    });

    it('should round to 2 decimal places', () => {
      expect(calcSetEfficiency(77, 90)).toBe(0.86);
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