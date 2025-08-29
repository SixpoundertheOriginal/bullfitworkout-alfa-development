// Pure functions for derived KPI calculations
import type { PerWorkoutMetrics } from '../dto';

// Default target rest time in seconds (conservative)
const DEFAULT_TARGET_REST_SEC = 90;

/**
 * Calculate workout density in kg/min
 * @param tonnageKg Total tonnage for the workout
 * @param durationMin Duration in minutes
 * @returns Density in kg/min, 0 if duration is invalid
 */
export function calcWorkoutDensityKgPerMin(tonnageKg: number, durationMin: number): number {
  if (durationMin <= 0) return 0;
  return Math.round((tonnageKg / durationMin) * 100) / 100; // 2 decimal places
}

/**
 * Calculate average rest time per session
 * @param restSecTotal Total rest time in seconds
 * @param setCount Number of sets
 * @returns Average rest per set in seconds, 0 if no sets
 */
export function calcAvgRestPerSession(restSecTotal: number, setCount: number): number {
  if (setCount <= 0) return 0;
  return Math.floor(restSecTotal / setCount);
}

/**
 * Calculate set efficiency ratio
 * @param avgRestSec Average rest time in seconds
 * @param targetRestSec Target rest time in seconds (optional)
 * @returns Efficiency ratio (<1 good, >1 over-resting), null if no target
 */
export function calcSetEfficiency(avgRestSec: number, targetRestSec?: number): number | null {
  if (!targetRestSec || targetRestSec <= 0) return null;
  return Math.round((avgRestSec / targetRestSec) * 100) / 100; // 2 decimal places
}

/**
 * Get target rest time for a workout (currently uses default)
 * @param workout Workout metrics
 * @returns Target rest time in seconds or undefined
 */
export function getTargetRestSecForWorkout(workout: PerWorkoutMetrics): number | undefined {
  // For now, use conservative default
  // Later: read from workout metadata, exercise type, user preferences
  return DEFAULT_TARGET_REST_SEC;
}