// Global Exercise Search Service - Server-side search with database optimization
import { supabase } from '@/integrations/supabase/client';
import type { Exercise } from './exerciseDataService';

export interface ExerciseFilters {
  muscleGroups?: string[];
  equipment?: string[];
  difficulty?: string;
  isCompound?: boolean;
  includeCustom?: boolean;
  trainingGoals?: string[];
}

export interface SearchResult<T> {
  data: T;
  total: number;
  query: string;
  filters: ExerciseFilters;
  executionTime?: number;
}

export interface ExerciseSuggestion extends Exercise {
  relevanceScore: number;
  reason: string;
}

/**
 * Global Exercise Search Service
 * 
 * Replaces client-side filtering with optimized database search
 * Provides comprehensive search across all exercises with proper filtering
 */
export class GlobalExerciseSearchService {
  /**
   * Searches all exercises using database full-text search and filtering
   * Replaces tab-based search limitations with global search
   */
  async searchAllExercises(
    query: string,
    filters?: ExerciseFilters,
    pagination?: { offset: number; limit: number }
  ): Promise<SearchResult<Exercise[]>> {
    const startTime = Date.now();
    
    try {
      let searchQuery = supabase
        .from('exercises')
        .select(`
          id, name, description, primary_muscle_groups,
          secondary_muscle_groups, equipment_type, difficulty,
          movement_pattern, is_compound, is_custom,
          instructions, tips, variations, metadata
        `, { count: 'exact' })
        .range(
          pagination?.offset || 0, 
          (pagination?.offset || 0) + (pagination?.limit || 50) - 1
        );
      
      // Apply text search using database capabilities
      if (query.trim()) {
        searchQuery = searchQuery.or(`
          name.ilike.%${query}%,
          description.ilike.%${query}%
        `);
      }
      
      // Apply filters
      if (filters?.muscleGroups?.length) {
        searchQuery = searchQuery.overlaps('primary_muscle_groups', filters.muscleGroups);
      }
      
      if (filters?.equipment?.length) {
        searchQuery = searchQuery.overlaps('equipment_type', filters.equipment);
      }
      
      if (filters?.difficulty) {
        searchQuery = searchQuery.eq('difficulty', filters.difficulty);
      }
      
      if (filters?.isCompound !== undefined) {
        searchQuery = searchQuery.eq('is_compound', filters.isCompound);
      }
      
      // Exclude custom exercises for global search unless specified
      if (!filters?.includeCustom) {
        searchQuery = searchQuery.eq('is_custom', false);
      }
      
      const { data, error, count } = await searchQuery;
      
      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }
      
      return {
        data: data || [],
        total: count || 0,
        query,
        filters: filters || {},
        executionTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Error in searchAllExercises:', error);
      throw error;
    }
  }
  
  /**
   * Gets exercise suggestions based on user history and preferences
   * Uses analytics to suggest relevant exercises
   */
  async getSuggestedExercises(
    userId: string, 
    workoutType?: string,
    limit: number = 10
  ): Promise<ExerciseSuggestion[]> {
    try {
      // Get user's recent exercise history
      const { data: recentSets, error: setsError } = await supabase
        .from('exercise_sets')
        .select(`
          exercise_name,
          workout_sessions!inner(user_id, training_type, start_time)
        `)
        .eq('workout_sessions.user_id', userId)
        .gte('workout_sessions.start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .limit(100);
      
      if (setsError) {
        console.error('Error fetching recent sets:', setsError);
        return [];
      }
      
      // Analyze exercise frequency and patterns
      const exerciseFrequency = new Map<string, number>();
      const exercisesByType = new Map<string, Set<string>>();
      
      (recentSets || []).forEach((set: any) => {
        const exerciseName = set.exercise_name;
        const trainingType = set.workout_sessions?.training_type;
        
        exerciseFrequency.set(exerciseName, (exerciseFrequency.get(exerciseName) || 0) + 1);
        
        if (trainingType) {
          if (!exercisesByType.has(trainingType)) {
            exercisesByType.set(trainingType, new Set());
          }
          exercisesByType.get(trainingType)!.add(exerciseName);
        }
      });
      
      // Get exercises user hasn't done recently for variety
      const recentExerciseNames = Array.from(exerciseFrequency.keys());
      
      let suggestionQuery = supabase
        .from('exercises')
        .select('*')
        .eq('is_custom', false)
        .limit(limit * 2); // Get more to filter and rank
      
      // Filter by workout type if specified
      if (workoutType) {
        const workoutTypeMapping: Record<string, string[]> = {
          'Strength': ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
          'Cardio': ['full_body', 'core'],
          'Yoga': ['core', 'full_body'],
          'Calisthenics': ['chest', 'back', 'core']
        };
        
        const relevantMuscles = workoutTypeMapping[workoutType];
        if (relevantMuscles) {
          suggestionQuery = suggestionQuery.overlaps('primary_muscle_groups', relevantMuscles);
        }
      }
      
      // Exclude recently performed exercises for variety
      if (recentExerciseNames.length > 0) {
        suggestionQuery = suggestionQuery.not('name', 'in', `(${recentExerciseNames.join(',')})`);
      }
      
      const { data: candidateExercises, error: exercisesError } = await suggestionQuery;
      
      if (exercisesError) {
        console.error('Error fetching candidate exercises:', exercisesError);
        return [];
      }
      
      // Rank suggestions based on various factors
      const suggestions: ExerciseSuggestion[] = (candidateExercises || [])
        .map(exercise => {
          let relevanceScore = 0.5; // Base score
          let reason = 'Recommended for variety';
          
          // Boost compound exercises
          if (exercise.is_compound) {
            relevanceScore += 0.2;
            reason = 'Compound exercise for efficiency';
          }
          
          // Boost exercises matching workout type
          if (workoutType && exercise.metadata && typeof exercise.metadata === 'object') {
            const metadata = exercise.metadata as any;
            if (metadata.training_goals?.includes?.(workoutType.toLowerCase())) {
              relevanceScore += 0.3;
              reason = `Great for ${workoutType} training`;
            }
          }
          
          // Boost exercises targeting undertrained muscle groups
          const userMuscleFrequency = new Map<string, number>();
          recentExerciseNames.forEach(name => {
            // Would need to look up muscle groups for each exercise
            // Simplified for now
          });
          
          return {
            ...exercise,
            relevanceScore,
            reason
          };
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
      
      return suggestions;
      
    } catch (error) {
      console.error('Error in getSuggestedExercises:', error);
      return [];
    }
  }
  
  /**
   * Searches for exercises with advanced filtering and ranking
   */
  async advancedSearch(
    criteria: {
      query?: string;
      muscleGroups?: string[];
      equipment?: string[];
      difficulty?: string[];
      movementPatterns?: string[];
      trainingGoals?: string[];
      excludeRecent?: boolean;
      userId?: string;
    },
    pagination?: { offset: number; limit: number }
  ): Promise<SearchResult<Exercise[]>> {
    try {
      let searchQuery = supabase
        .from('exercises')
        .select('*', { count: 'exact' })
        .eq('is_custom', false);
      
      // Apply text search
      if (criteria.query?.trim()) {
        searchQuery = searchQuery.or(`
          name.ilike.%${criteria.query}%,
          description.ilike.%${criteria.query}%
        `);
      }
      
      // Apply muscle group filters
      if (criteria.muscleGroups?.length) {
        searchQuery = searchQuery.or(`
          primary_muscle_groups.ov.{${criteria.muscleGroups.join(',')}},
          secondary_muscle_groups.ov.{${criteria.muscleGroups.join(',')}}
        `);
      }
      
      // Apply equipment filters
      if (criteria.equipment?.length) {
        searchQuery = searchQuery.overlaps('equipment_type', criteria.equipment);
      }
      
      // Apply difficulty filters
      if (criteria.difficulty?.length) {
        searchQuery = searchQuery.in('difficulty', criteria.difficulty);
      }
      
      // Apply movement pattern filters
      if (criteria.movementPatterns?.length) {
        searchQuery = searchQuery.in('movement_pattern', criteria.movementPatterns);
      }
      
      // Exclude recent exercises if requested
      if (criteria.excludeRecent && criteria.userId) {
        const { data: recentSets } = await supabase
          .from('exercise_sets')
          .select(`
            exercise_name,
            workout_sessions!inner(user_id)
          `)
          .eq('workout_sessions.user_id', criteria.userId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days
        
        const recentExerciseNames = [...new Set((recentSets || []).map((s: any) => s.exercise_name))];
        
        if (recentExerciseNames.length > 0) {
          searchQuery = searchQuery.not('name', 'in', `(${recentExerciseNames.join(',')})`);
        }
      }
      
      // Apply pagination
      if (pagination) {
        searchQuery = searchQuery.range(
          pagination.offset, 
          pagination.offset + pagination.limit - 1
        );
      }
      
      const { data, error, count } = await searchQuery;
      
      if (error) {
        throw new Error(`Advanced search failed: ${error.message}`);
      }
      
      return {
        data: data || [],
        total: count || 0,
        query: criteria.query || '',
        filters: {
          muscleGroups: criteria.muscleGroups,
          equipment: criteria.equipment,
          difficulty: criteria.difficulty?.[0], // For compatibility
        }
      };
      
    } catch (error) {
      console.error('Error in advancedSearch:', error);
      throw error;
    }
  }
  
  /**
   * Gets popular exercises based on usage statistics
   */
  async getPopularExercises(
    limit: number = 20,
    timeframe: 'week' | 'month' | 'all' = 'month'
  ): Promise<Array<Exercise & { usageCount: number }>> {
    try {
      const timeframeDays = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365;
      const cutoffDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000).toISOString();
      
      // Get exercise usage statistics
      const { data: exerciseStats, error: statsError } = await supabase
        .from('exercise_sets')
        .select(`
          exercise_name,
          workout_sessions!inner(start_time)
        `)
        .gte('workout_sessions.start_time', cutoffDate);
      
      if (statsError) {
        console.error('Error fetching exercise stats:', statsError);
        return [];
      }
      
      // Count usage frequency
      const usageMap = new Map<string, number>();
      (exerciseStats || []).forEach((stat: any) => {
        const name = stat.exercise_name;
        usageMap.set(name, (usageMap.get(name) || 0) + 1);
      });
      
      // Get top exercises
      const topExerciseNames = Array.from(usageMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name]) => name);
      
      if (topExerciseNames.length === 0) {
        return [];
      }
      
      // Fetch exercise details
      const { data: exercises, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .in('name', topExerciseNames);
      
      if (exercisesError) {
        console.error('Error fetching exercise details:', exercisesError);
        return [];
      }
      
      // Combine with usage counts and maintain order
      return topExerciseNames
        .map(name => {
          const exercise = exercises?.find(e => e.name === name);
          if (!exercise) return null;
          
          return {
            ...exercise,
            usageCount: usageMap.get(name) || 0
          };
        })
        .filter(Boolean) as Array<Exercise & { usageCount: number }>;
      
    } catch (error) {
      console.error('Error in getPopularExercises:', error);
      return [];
    }
  }
}