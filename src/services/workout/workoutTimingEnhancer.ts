// Phase 2: Workout Save Service Enhancement for Timing Data
// Enhances workout save operations to preserve accurate timing data

import { supabase } from '@/integrations/supabase/client';

export interface EnhancedSetData {
  exercise_name: string;
  weight: number;
  reps: number;
  set_number: number;
  completed: boolean;
  rest_time?: number; // Legacy field for backward compatibility
  
  // New timing fields
  started_at?: string;
  completed_at?: string;
  actual_rest_ms?: number;
  timing_source?: 'actual' | 'estimated' | 'manual';
  
  // Additional fields
  rpe?: number;
  variant_id?: string;
  tempo?: string;
  range_of_motion?: string;
  added_weight?: number;
  assistance_used?: number;
  notes?: string;
  failure_point?: string;
  form_score?: number;
}

export interface WorkoutTimingData {
  workout_data: {
    user_id: string;
    name: string;
    training_type: string;
    start_time: string;
    end_time: string;
    duration: number;
    notes?: string;
  };
  exercise_sets: EnhancedSetData[];
}

/**
 * Enhanced workout save service that preserves timing data integrity
 */
export class WorkoutTimingEnhancer {
  
  /**
   * Enhance exercise sets with proper timing data before save
   */
  static enhanceSetTiming(
    sets: EnhancedSetData[],
    setTimings?: Map<string, { startTime?: number; endTime?: number }>
  ): EnhancedSetData[] {
    console.debug('[timing-enhancer.enhance]', {
      setCount: sets.length,
      hasTimingData: setTimings ? setTimings.size : 0
    });

    return sets.map((set, index) => {
      const setKey = `${set.exercise_name}-${set.set_number}`;
      const timing = setTimings?.get(setKey);
      
      const enhanced: EnhancedSetData = {
        ...set,
        timing_source: 'estimated' // Default fallback
      };

      // Add actual timing data if available
      if (timing?.startTime) {
        enhanced.started_at = new Date(timing.startTime).toISOString();
        enhanced.timing_source = 'actual';
      }

      if (timing?.endTime) {
        enhanced.completed_at = new Date(timing.endTime).toISOString();
        enhanced.timing_source = 'actual';
      }

      // Calculate rest time from previous set if we have accurate timing
      if (index > 0 && enhanced.started_at) {
        const prevSet = sets[index - 1];
        const prevTiming = setTimings?.get(`${prevSet.exercise_name}-${prevSet.set_number}`);
        
        if (prevTiming?.endTime) {
          const restMs = timing!.startTime! - prevTiming.endTime;
          if (restMs >= 0 && restMs < 30 * 60 * 1000) { // Cap at 30 minutes
            enhanced.actual_rest_ms = restMs;
            enhanced.timing_source = 'actual';
          }
        }
      }

      console.debug('[timing-enhancer.set]', {
        exercise: set.exercise_name,
        setNumber: set.set_number,
        hasStartTime: !!enhanced.started_at,
        hasCompleteTime: !!enhanced.completed_at,
        restMs: enhanced.actual_rest_ms,
        timingSource: enhanced.timing_source
      });

      return enhanced;
    });
  }

  /**
   * Save workout with enhanced timing data
   */
  static async saveWorkoutWithTiming(
    workoutData: WorkoutTimingData,
    setTimings?: Map<string, { startTime?: number; endTime?: number }>
  ): Promise<{ workoutId: string; timingQuality: 'high' | 'medium' | 'low' }> {
    
    // Enhance sets with timing data
    const enhancedSets = this.enhanceSetTiming(workoutData.exercise_sets, setTimings);
    
    // Calculate timing quality score
    const actualTimingCount = enhancedSets.filter(s => s.timing_source === 'actual').length;
    const timingAccuracy = actualTimingCount / Math.max(1, enhancedSets.length);
    
    let timingQuality: 'high' | 'medium' | 'low' = 'low';
    if (timingAccuracy >= 0.8) timingQuality = 'high';
    else if (timingAccuracy >= 0.5) timingQuality = 'medium';

    console.debug('[timing-enhancer.save]', {
      setCount: enhancedSets.length,
      actualTimingCount,
      timingAccuracy: Math.round(timingAccuracy * 100) + '%',
      timingQuality
    });

    try {
      // Use the enhanced save_workout_transaction function
      const { data: result, error } = await supabase.rpc('save_workout_transaction', {
        p_workout_data: workoutData.workout_data as any,
        p_exercise_sets: enhancedSets as any
      });

      if (error) {
        console.error('[timing-enhancer.error]', error);
        throw error;
      }

      console.debug('[timing-enhancer.success]', {
        workoutId: (result as any)?.workout_id,
        timingQuality
      });

      return {
        workoutId: (result as any)?.workout_id,
        timingQuality
      };
      
    } catch (error) {
      console.error('[timing-enhancer.save-error]', error);
      throw error;
    }
  }

  /**
   * Validate timing data before save
   */
  static validateTimingData(sets: EnhancedSetData[]): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    let prevCompleteTime: number | null = null;

    sets.forEach((set, index) => {
      // Check for basic timing data
      if (!set.started_at && !set.completed_at) {
        warnings.push(`Set ${index + 1}: No timing data available`);
      }

      // Validate timing sequence
      if (set.started_at && set.completed_at) {
        const startTime = new Date(set.started_at).getTime();
        const completeTime = new Date(set.completed_at).getTime();

        if (completeTime <= startTime) {
          errors.push(`Set ${index + 1}: Completion time before or equal to start time`);
        }

        const setDuration = completeTime - startTime;
        if (setDuration > 10 * 60 * 1000) {
          warnings.push(`Set ${index + 1}: Very long set duration (${Math.round(setDuration / 1000)}s)`);
        }

        // Check rest time consistency
        if (prevCompleteTime && set.actual_rest_ms) {
          const expectedRest = startTime - prevCompleteTime;
          const recordedRest = set.actual_rest_ms;
          
          if (Math.abs(expectedRest - recordedRest) > 5000) { // 5 second tolerance
            warnings.push(`Set ${index + 1}: Rest time mismatch (expected: ${Math.round(expectedRest / 1000)}s, recorded: ${Math.round(recordedRest / 1000)}s)`);
          }
        }

        prevCompleteTime = completeTime;
      }
    });

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }
}