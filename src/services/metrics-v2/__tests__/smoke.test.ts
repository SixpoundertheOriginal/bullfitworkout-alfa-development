import { describe, it, expect } from 'vitest';
import { 
  calcWorkoutDensityKgPerMin, 
  calcAvgRestPerSession, 
  calcSetEfficiency
} from '../calculators/derivedKpis';
import { aggregatePerWorkout } from '../aggregators';

describe('metrics-v2 smoke tests', () => {
  it('should export all required functions', () => {
    expect(typeof calcWorkoutDensityKgPerMin).toBe('function');
    expect(typeof calcAvgRestPerSession).toBe('function');
    expect(typeof calcSetEfficiency).toBe('function');
    expect(typeof aggregatePerWorkout).toBe('function');
  });

  it('should calculate basic KPIs correctly', () => {
    // Test the examples from requirements
    expect(calcWorkoutDensityKgPerMin(10000, 50)).toBe(200);
    expect(calcAvgRestPerSession(1200, 24)).toBe(50);
    expect(calcSetEfficiency(75, 90)).toBe(0.83);
  });

  it('should handle edge cases gracefully', () => {
    // Zero values
    expect(calcWorkoutDensityKgPerMin(10000, 0)).toBe(0);
    expect(calcAvgRestPerSession(1200, 0)).toBe(0);
    expect(calcSetEfficiency(75)).toBe(null);

    // Negative values
    expect(calcWorkoutDensityKgPerMin(10000, -10)).toBe(0);
    expect(calcAvgRestPerSession(1200, -5)).toBe(0);
    expect(calcSetEfficiency(75, -90)).toBe(null);
  });
});