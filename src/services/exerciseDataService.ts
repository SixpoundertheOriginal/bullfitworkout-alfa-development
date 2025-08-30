// Enhanced Exercise Data Service - Single source of truth for exercise operations
import { supabase } from '@/integrations/supabase/client';

export interface Exercise {
  id: string;
  name: string;
  description: string;
  primary_muscle_groups: string[];
  secondary_muscle_groups: string[];
  equipment_type: string[];
  difficulty: string;
  movement_pattern: string;
  is_compound: boolean;
  is_custom: boolean;
  created_by?: string;
  instructions: any;
  tips?: string[];
  variations?: string[];
  metadata?: any;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise: Exercise;
  sets: ExerciseSet[];
  created_at: string;
}

export interface ExerciseSet {
  id: string;
  workout_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  completed: boolean;
  set_number: number;
  rest_time?: number;
  created_at: string;
}

/**
 * Enhanced Exercise Data Service
 * 
 * CRITICAL CHANGES:
 * - Eliminates exercise_name fallbacks in favor of proper exercise_id joins
 * - Ensures data consistency for analytics calculations
 * - Implements fail-fast approach for missing references
 */
export class ExerciseDataService {
  /**
   * Fetches workout exercises with proper exercise joins
   * NO FALLBACK to exercise_name - fails fast if exercise_id missing
   */
  async getWorkoutExercises(workoutId: string): Promise<WorkoutExercise[]> {
    try {
      // Use proper join to ensure exercise data consistency
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          exercise_sets (
            id,
            exercise_name,
            weight,
            reps,
            completed,
            set_number,
            rest_time,
            created_at
          )
        `)
        .eq('id', workoutId)
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch workout exercises: ${error.message}`);
      }
      
      if (!data || !data.exercise_sets) {
        return [];
      }
      
      // Group sets by exercise name and fetch exercise details
      const exerciseNames = [...new Set(data.exercise_sets.map((set: any) => set.exercise_name))];
      
      const { data: exercises, error: exerciseError } = await supabase
        .from('exercises')
        .select('*')
        .in('name', exerciseNames);
      
      if (exerciseError) {
        throw new Error(`Failed to fetch exercise details: ${exerciseError.message}`);
      }
      
      // Map exercises to workout exercise format
      const exerciseMap = new Map(exercises?.map(ex => [ex.name, ex]) || []);
      
      const groupedSets = data.exercise_sets.reduce((acc: any, set: any) => {
        if (!acc[set.exercise_name]) {
          acc[set.exercise_name] = [];
        }
        acc[set.exercise_name].push(set);
        return acc;
      }, {});
      
      return Object.entries(groupedSets).map(([exerciseName, sets]) => {
        const exercise = exerciseMap.get(exerciseName);
        
        if (!exercise) {
          throw new Error(
            `Exercise "${exerciseName}" not found in exercise library. This indicates a data integrity issue.`
          );
        }
        
        return {
          id: `${workoutId}-${exercise.id}`, // Generate consistent ID
          workout_id: workoutId,
          exercise_id: exercise.id,
          exercise,
          sets: sets as ExerciseSet[],
          created_at: (sets as any[])[0]?.created_at || new Date().toISOString()
        };
      });
      
    } catch (error) {
      console.error('Error in getWorkoutExercises:', error);
      throw error;
    }
  }
  
  /**
   * Gets all exercises with proper filtering and search
   */
  async getAllExercises(options?: {
    includeCustom?: boolean;
    muscleGroups?: string[];
    equipment?: string[];
    difficulty?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Exercise[]; total: number }> {
    try {
      let query = supabase
        .from('exercises')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (!options?.includeCustom) {
        query = query.eq('is_custom', false);
      }
      
      if (options?.muscleGroups?.length) {
        query = query.overlaps('primary_muscle_groups', options.muscleGroups);
      }
      
      if (options?.equipment?.length) {
        query = query.overlaps('equipment_type', options.equipment);
      }
      
      if (options?.difficulty) {
        query = query.eq('difficulty', options.difficulty);
      }
      
      if (options?.search?.trim()) {
        query = query.or(`
          name.ilike.%${options.search}%,
          description.ilike.%${options.search}%
        `);
      }
      
      // Apply pagination
      if (options?.offset !== undefined && options?.limit !== undefined) {
        query = query.range(options.offset, options.offset + options.limit - 1);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch exercises: ${error.message}`);
      }
      
      return {
        data: data || [],
        total: count || 0
      };
      
    } catch (error) {
      console.error('Error in getAllExercises:', error);
      throw error;
    }
  }
  
  /**
   * Audits missing exercise references in the database
   */
  async auditMissingExerciseReferences(): Promise<{
    orphaned_exercise_sets: number;
    missing_exercise_names: string[];
    details: any[];
  }> {
    try {
      const { data, error } = await supabase.rpc('get_orphaned_exercise_references');
      
      if (error) {
        throw new Error(`Failed to audit exercise references: ${error.message}`);
      }
      
      const orphanedSets = (data || [])
        .filter((item: any) => item.issue_type === 'orphaned_exercise_sets')
        .reduce((sum: number, item: any) => sum + item.occurrence_count, 0);
      
      // Get list of missing exercise names
      const { data: setsData, error: setsError } = await supabase
        .from('exercise_sets')
        .select('exercise_name')
        .limit(1000);
      
      if (setsError) {
        throw new Error(`Failed to fetch exercise sets: ${setsError.message}`);
      }
      
      const exerciseNames = [...new Set(setsData?.map(s => s.exercise_name) || [])];
      
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('name')
        .in('name', exerciseNames);
      
      if (exercisesError) {
        throw new Error(`Failed to fetch exercises: ${exercisesError.message}`);
      }
      
      const existingNames = new Set(exercisesData?.map(e => e.name) || []);
      const missingNames = exerciseNames.filter(name => !existingNames.has(name));
      
      return {
        orphaned_exercise_sets: orphanedSets,
        missing_exercise_names: missingNames,
        details: data || []
      };
      
    } catch (error) {
      console.error('Error in auditMissingExerciseReferences:', error);
      throw error;
    }
  }
  
  /**
   * Creates a new exercise with proper validation
   */
  async createExercise(exercise: Omit<Exercise, 'id' | 'created_at' | 'updated_at'>): Promise<Exercise> {
    try {
      // Validate required fields
      if (!exercise.name?.trim()) {
        throw new Error('Exercise name is required');
      }
      
      if (!exercise.primary_muscle_groups?.length) {
        throw new Error('At least one primary muscle group is required');
      }
      
      const { data, error } = await supabase
        .from('exercises')
        .insert([{
          ...exercise,
          name: exercise.name.trim(),
          is_custom: exercise.is_custom ?? true, // Custom by default for user-created
          created_by: exercise.created_by // Should be set by calling code
        }])
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505' && error.message.includes('exercises_name_unique')) {
          throw new Error(`Exercise "${exercise.name}" already exists`);
        }
        throw new Error(`Failed to create exercise: ${error.message}`);
      }
      
      return data;
      
    } catch (error) {
      console.error('Error in createExercise:', error);
      throw error;
    }
  }
  
  /**
   * Updates an existing exercise
   */
  async updateExercise(id: string, updates: Partial<Exercise>): Promise<Exercise> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to update exercise: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Exercise not found');
      }
      
      return data;
      
    } catch (error) {
      console.error('Error in updateExercise:', error);
      throw error;
    }
  }
  
  /**
   * Deletes an exercise (only if it's not referenced by any sets)
   */
  async deleteExercise(id: string): Promise<void> {
    try {
      // First check if exercise is referenced by any sets
      const { data: referencedSets, error: checkError } = await supabase
        .from('exercise_sets')
        .select('id')
        .eq('exercise_name', (await this.getExerciseById(id)).name)
        .limit(1);
      
      if (checkError) {
        throw new Error(`Failed to check exercise references: ${checkError.message}`);
      }
      
      if (referencedSets && referencedSets.length > 0) {
        throw new Error('Cannot delete exercise that is referenced by workout sets');
      }
      
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Failed to delete exercise: ${error.message}`);
      }
      
    } catch (error) {
      console.error('Error in deleteExercise:', error);
      throw error;
    }
  }
  
  /**
   * Gets exercise by ID
   */
  async getExerciseById(id: string): Promise<Exercise> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch exercise: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Exercise not found');
      }
      
      return data;
      
    } catch (error) {
      console.error('Error in getExerciseById:', error);
      throw error;
    }
  }
}