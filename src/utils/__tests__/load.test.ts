/**
 * Unit tests for centralized load calculation functions
 */

import { describe, it, expect } from 'vitest';
import {
  isBodyweight,
  effectiveLoadPerRepKg,
  isometricLoadKg,
  isometricWorkKgSec,
  isUsingDefaultBodyweight,
  formatLoadKg
} from '../load';
import { Exercise } from '@/types/exercise';

const createExercise = (overrides: Partial<Exercise>): Exercise => ({
  id: 'test-id',
  name: 'Test Exercise',
  user_id: 'test-user',
  created_at: new Date().toISOString(),
  description: 'Test description',
  primary_muscle_groups: ['chest'],
  secondary_muscle_groups: [],
  equipment_type: ['bodyweight'],
  movement_pattern: 'push',
  difficulty: 'intermediate',
  instructions: {},
  is_compound: false,
  tips: [],
  variations: [],
  metadata: {},
  type: 'reps',
  is_bodyweight: true,
  ...overrides
});

describe('isBodyweight', () => {
  it('returns true for exercises with is_bodyweight=true', () => {
    const exercise = createExercise({ is_bodyweight: true });
    expect(isBodyweight(exercise)).toBe(true);
  });

  it('returns true for exercises with bodyweight equipment', () => {
    const exercise = createExercise({ 
      is_bodyweight: false,
      equipment_type: ['bodyweight']
    });
    expect(isBodyweight(exercise)).toBe(true);
  });

  it('returns true for exercises with bodyweight loading_type', () => {
    const exercise = createExercise({ 
      is_bodyweight: false,
      equipment_type: ['other'],
      loading_type: 'bodyweight'
    });
    expect(isBodyweight(exercise)).toBe(true);
  });

  it('returns true for exercises with bw_multiplier', () => {
    const exercise = createExercise({ 
      is_bodyweight: false,
      equipment_type: ['other'],
      bw_multiplier: 0.65
    });
    expect(isBodyweight(exercise)).toBe(true);
  });

  it('returns false for non-bodyweight exercises', () => {
    const exercise = createExercise({ 
      is_bodyweight: false,
      equipment_type: ['barbell'],
      loading_type: 'external'
    });
    expect(isBodyweight(exercise)).toBe(false);
  });
});

describe('effectiveLoadPerRepKg', () => {
  it('calculates pull-up load correctly (80kg, multiplier 0.95)', () => {
    const exercise = createExercise({ 
      name: 'Pull-up',
      type: 'reps',
      bw_multiplier: 0.95
    });
    
    const load = effectiveLoadPerRepKg(exercise, 80);
    expect(load).toBe(76); // 80 * 0.95
  });

  it('calculates pull-up with additional weight (80kg + 10kg)', () => {
    const exercise = createExercise({ 
      name: 'Pull-up',
      type: 'reps',
      bw_multiplier: 0.95
    });
    
    const load = effectiveLoadPerRepKg(exercise, 80, 10);
    expect(load).toBe(86); // (80 * 0.95) + 10
  });

  it('calculates push-up load correctly (80kg, multiplier 0.65)', () => {
    const exercise = createExercise({ 
      name: 'Push-up',
      type: 'reps',
      bw_multiplier: 0.65
    });
    
    const load = effectiveLoadPerRepKg(exercise, 80);
    expect(load).toBe(52); // 80 * 0.65
  });

  it('uses 70kg fallback when bodyweight is null', () => {
    const exercise = createExercise({ 
      name: 'Pull-up',
      type: 'reps',
      bw_multiplier: 0.95
    });
    
    const load = effectiveLoadPerRepKg(exercise, null);
    expect(load).toBe(66.5); // 70 * 0.95
  });

  it('uses 70kg fallback when bodyweight is undefined', () => {
    const exercise = createExercise({ 
      name: 'Pull-up',
      type: 'reps',
      bw_multiplier: 0.95
    });
    
    const load = effectiveLoadPerRepKg(exercise);
    expect(load).toBe(66.5); // 70 * 0.95
  });

  it('uses default multiplier 0.65 when bw_multiplier is missing', () => {
    const exercise = createExercise({ 
      type: 'reps',
      bw_multiplier: undefined
    });
    
    const load = effectiveLoadPerRepKg(exercise, 80);
    expect(load).toBe(52); // 80 * 0.65 (default)
  });

  it('returns null for non-bodyweight exercises', () => {
    const exercise = createExercise({ 
      is_bodyweight: false,
      equipment_type: ['barbell'],
      type: 'reps'
    });
    
    const load = effectiveLoadPerRepKg(exercise, 80);
    expect(load).toBeNull();
  });

  it('returns null for non-reps exercises', () => {
    const exercise = createExercise({ 
      type: 'hold'
    });
    
    const load = effectiveLoadPerRepKg(exercise, 80);
    expect(load).toBeNull();
  });
});

describe('isometricLoadKg', () => {
  it('calculates plank load correctly (90kg, multiplier 0.25)', () => {
    const exercise = createExercise({ 
      name: 'Plank',
      type: 'hold',
      bw_multiplier: 0.25,
      static_posture_factor: 1.0
    });
    
    const load = isometricLoadKg(exercise, 90);
    expect(load).toBe(22.5); // 90 * 0.25 * 1.0
  });

  it('applies static posture factor', () => {
    const exercise = createExercise({ 
      name: 'L-Sit',
      type: 'hold',
      bw_multiplier: 0.7,
      static_posture_factor: 1.2
    });
    
    const load = isometricLoadKg(exercise, 80);
    expect(load).toBe(67.2); // 80 * 0.7 * 1.2
  });

  it('uses default posture factor of 1.0', () => {
    const exercise = createExercise({ 
      type: 'hold',
      bw_multiplier: 0.5,
      static_posture_factor: undefined
    });
    
    const load = isometricLoadKg(exercise, 80);
    expect(load).toBe(40); // 80 * 0.5 * 1.0
  });

  it('works with time type exercises', () => {
    const exercise = createExercise({ 
      type: 'time',
      bw_multiplier: 0.6
    });
    
    const load = isometricLoadKg(exercise, 80);
    expect(load).toBe(48); // 80 * 0.6 * 1.0
  });

  it('returns null for non-bodyweight exercises', () => {
    const exercise = createExercise({ 
      is_bodyweight: false,
      equipment_type: ['barbell'],
      type: 'hold'
    });
    
    const load = isometricLoadKg(exercise, 80);
    expect(load).toBeNull();
  });

  it('returns null for non-isometric exercises', () => {
    const exercise = createExercise({ 
      type: 'reps'
    });
    
    const load = isometricLoadKg(exercise, 80);
    expect(load).toBeNull();
  });
});

describe('isometricWorkKgSec', () => {
  it('calculates plank work correctly (90kg, 60s)', () => {
    const exercise = createExercise({ 
      name: 'Plank',
      type: 'hold',
      bw_multiplier: 0.25
    });
    
    const work = isometricWorkKgSec(exercise, 60, 90);
    expect(work).toBe(1350); // 90 * 0.25 * 60 = 22.5 * 60
  });

  it('returns 0 for non-applicable exercises', () => {
    const exercise = createExercise({ 
      is_bodyweight: false,
      equipment_type: ['barbell'],
      type: 'reps'
    });
    
    const work = isometricWorkKgSec(exercise, 60, 80);
    expect(work).toBe(0);
  });
});

describe('Hanging exercises', () => {
  it('calculates hanging leg raise load (80kg, multiplier 0.60)', () => {
    const exercise = createExercise({ 
      name: 'Hanging Leg Raise',
      type: 'reps',
      bw_multiplier: 0.60
    });
    
    const load = effectiveLoadPerRepKg(exercise, 80);
    expect(load).toBe(48); // 80 * 0.60
  });

  it('calculates hanging knee raise load (80kg, multiplier 0.45)', () => {
    const exercise = createExercise({ 
      name: 'Hanging Knee Raise',
      type: 'reps',
      bw_multiplier: 0.45
    });
    
    const load = effectiveLoadPerRepKg(exercise, 80);
    expect(load).toBe(36); // 80 * 0.45
  });
});

describe('isUsingDefaultBodyweight', () => {
  it('returns true for null bodyweight', () => {
    expect(isUsingDefaultBodyweight(null)).toBe(true);
  });

  it('returns true for undefined bodyweight', () => {
    expect(isUsingDefaultBodyweight(undefined)).toBe(true);
  });

  it('returns true for 70kg bodyweight', () => {
    expect(isUsingDefaultBodyweight(70)).toBe(true);
  });

  it('returns false for other bodyweights', () => {
    expect(isUsingDefaultBodyweight(80)).toBe(false);
    expect(isUsingDefaultBodyweight(65)).toBe(false);
  });
});

describe('formatLoadKg', () => {
  it('formats whole numbers without decimals', () => {
    expect(formatLoadKg(75)).toBe('75');
    expect(formatLoadKg(100)).toBe('100');
  });

  it('formats decimals with one digit precision', () => {
    expect(formatLoadKg(75.5)).toBe('75.5');
    expect(formatLoadKg(66.7)).toBe('66.7');
  });

  it('rounds to one decimal place', () => {
    expect(formatLoadKg(75.25)).toBe('75.3');
    expect(formatLoadKg(66.67)).toBe('66.7');
  });
});