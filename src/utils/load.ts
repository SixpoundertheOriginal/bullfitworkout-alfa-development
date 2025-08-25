/**
 * Centralized Load Calculation Module
 * 
 * Single source of truth for bodyweight and static load calculations.
 * All functions are pure and side-effect-free.
 */

import { Exercise } from '@/types/exercise';

/**
 * Determines if an exercise is bodyweight-based
 */
export function isBodyweight(exercise: Exercise): boolean {
  return (
    exercise.is_bodyweight === true ||
    exercise.equipment_type?.includes('bodyweight') ||
    exercise.loading_type === 'bodyweight' ||
    Boolean(exercise.bw_multiplier)
  );
}

/**
 * Calculates effective load per rep in kg for bodyweight exercises
 * 
 * @param exercise - Exercise configuration
 * @param bodyweightKg - User's bodyweight in kg (falls back to 70kg)
 * @param externalKg - Additional external weight in kg
 * @returns Effective load per rep in kg, or null if not applicable
 */
export function effectiveLoadPerRepKg(
  exercise: Exercise,
  bodyweightKg?: number | null,
  externalKg: number = 0
): number | null {
  if (!isBodyweight(exercise) || exercise.type !== 'reps') {
    return null;
  }

  const bw = bodyweightKg || 70; // Canonical fallback
  const multiplier = exercise.bw_multiplier || 0.65; // Default bodyweight multiplier
  
  return (bw * multiplier) + externalKg;
}

/**
 * Calculates isometric load in kg for hold/time exercises
 * 
 * @param exercise - Exercise configuration
 * @param bodyweightKg - User's bodyweight in kg (falls back to 70kg)
 * @param externalKg - Additional external weight in kg
 * @returns Isometric load in kg, or null if not applicable
 */
export function isometricLoadKg(
  exercise: Exercise,
  bodyweightKg?: number | null,
  externalKg: number = 0
): number | null {
  if (!isBodyweight(exercise) || !['hold', 'time'].includes(exercise.type)) {
    return null;
  }

  const bw = bodyweightKg || 70; // Canonical fallback
  const multiplier = exercise.bw_multiplier || 0.65;
  const postureFactor = exercise.static_posture_factor || 1.0;
  
  const baseLoad = bw ? (bw * multiplier) : externalKg;
  return baseLoad * postureFactor;
}

/**
 * Calculates total isometric work in kg·s
 * 
 * @param exercise - Exercise configuration
 * @param durationSec - Duration in seconds
 * @param bodyweightKg - User's bodyweight in kg (falls back to 70kg)
 * @param externalKg - Additional external weight in kg
 * @returns Total work in kg·s
 */
export function isometricWorkKgSec(
  exercise: Exercise,
  durationSec: number,
  bodyweightKg?: number | null,
  externalKg: number = 0
): number {
  const load = isometricLoadKg(exercise, bodyweightKg, externalKg);
  
  if (load === null) {
    return 0; // Not applicable for non-isometric exercises
  }
  
  return load * durationSec;
}

/**
 * Helper to check if user is using default bodyweight fallback
 */
export function isUsingDefaultBodyweight(bodyweightKg?: number | null): boolean {
  return !bodyweightKg || bodyweightKg === 70;
}

/**
 * Formats load display with appropriate precision
 */
export function formatLoadKg(loadKg: number): string {
  return loadKg % 1 === 0 ? `${loadKg}` : `${loadKg.toFixed(1)}`;
}