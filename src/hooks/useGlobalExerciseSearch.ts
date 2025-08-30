// Global Exercise Search Hook - Replaces tab-based search limitations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GlobalExerciseSearchService, type ExerciseFilters, type SearchResult } from '@/services/exerciseSearchService';
import type { Exercise } from '@/services/exerciseDataService';
import { useCallback } from 'react';

const searchService = new GlobalExerciseSearchService();

export interface UseGlobalExerciseSearchOptions {
  query: string;
  filters?: ExerciseFilters;
  pagination?: { offset: number; limit: number };
  enabled?: boolean;
}

/**
 * Global Exercise Search Hook
 * 
 * Replaces tab-based search with comprehensive global search
 * Provides server-side filtering and search across all exercises
 */
export function useGlobalExerciseSearch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      query,
      filters,
      pagination
    }: {
      query: string;
      filters?: ExerciseFilters;
      pagination?: { offset: number; limit: number };
    }): Promise<SearchResult<Exercise[]>> => {
      return await searchService.searchAllExercises(query, filters, pagination);
    },
    onError: (error) => {
      console.error('Global exercise search failed:', error);
      // Could implement fallback to client-side search here if needed
    },
    onSuccess: (data) => {
      // Cache successful searches for better UX
      queryClient.setQueryData(
        ['exercise-search', data.query, data.filters], 
        data
      );
    }
  });
}

/**
 * Advanced Exercise Search Hook
 * Provides more sophisticated search capabilities
 */
export function useAdvancedExerciseSearch() {
  return useMutation({
    mutationFn: async (criteria: {
      query?: string;
      muscleGroups?: string[];
      equipment?: string[];
      difficulty?: string[];
      movementPatterns?: string[];
      trainingGoals?: string[];
      excludeRecent?: boolean;
      userId?: string;
    }) => {
      return await searchService.advancedSearch(criteria);
    }
  });
}

/**
 * Exercise Suggestions Hook
 * Gets personalized exercise suggestions based on user history
 */
export function useExerciseSuggestions(
  userId: string,
  workoutType?: string,
  options?: { enabled?: boolean; limit?: number }
) {
  return useQuery({
    queryKey: ['exercise-suggestions', userId, workoutType],
    queryFn: () => searchService.getSuggestedExercises(
      userId, 
      workoutType, 
      options?.limit || 10
    ),
    enabled: !!userId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Popular Exercises Hook
 * Gets trending/popular exercises based on usage statistics
 */
export function usePopularExercises(
  timeframe: 'week' | 'month' | 'all' = 'month',
  limit: number = 20
) {
  return useQuery({
    queryKey: ['popular-exercises', timeframe, limit],
    queryFn: () => searchService.getPopularExercises(limit, timeframe),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Unified Exercise Search Hook
 * Replaces tab-based search with global search capabilities
 */
export function useExerciseSearch() {
  const globalSearch = useGlobalExerciseSearch();
  const advancedSearch = useAdvancedExerciseSearch();
  
  const searchExercises = useCallback(async (
    query: string,
    filters?: ExerciseFilters,
    pagination?: { offset: number; limit: number }
  ): Promise<SearchResult<Exercise[]>> => {
    // Always search ALL exercises, not just current tab
    return await globalSearch.mutateAsync({ query, filters, pagination });
  }, [globalSearch]);
  
  const advancedSearchExercises = useCallback(async (criteria: {
    query?: string;
    muscleGroups?: string[];
    equipment?: string[];
    difficulty?: string[];
    movementPatterns?: string[];
    trainingGoals?: string[];
    excludeRecent?: boolean;
    userId?: string;
  }) => {
    return await advancedSearch.mutateAsync(criteria);
  }, [advancedSearch]);
  
  return {
    // Basic search
    searchExercises,
    isSearching: globalSearch.isPending,
    searchError: globalSearch.error,
    searchResults: globalSearch.data,
    
    // Advanced search
    advancedSearchExercises,
    isAdvancedSearching: advancedSearch.isPending,
    advancedSearchError: advancedSearch.error,
    advancedSearchResults: advancedSearch.data,
    
    // Reset functions
    resetSearch: () => {
      globalSearch.reset();
      advancedSearch.reset();
    }
  };
}

/**
 * Exercise Search with Caching Hook
 * Provides cached search results for better performance
 */
export function useExerciseSearchWithCache(
  options: UseGlobalExerciseSearchOptions
) {
  const { query, filters, pagination, enabled = true } = options;
  
  return useQuery({
    queryKey: ['exercise-search-cached', query, filters, pagination],
    queryFn: () => searchService.searchAllExercises(query, filters, pagination),
    enabled: enabled && query.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: (previousData) => previousData, // Keep previous results while loading new ones
  });
}

/**
 * Exercise Filter Options Hook
 * Gets available filter options for the search interface
 */
export function useExerciseFilterOptions() {
  return useQuery({
    queryKey: ['exercise-filter-options'],
    queryFn: async () => {
      // Get unique values for filter options from the database
      const result = await searchService.searchAllExercises('', {}, { offset: 0, limit: 1000 });
      
      if (!result.data) {
        return {
          muscleGroups: [],
          equipment: [],
          difficulties: [],
          movementPatterns: []
        };
      }
      
      const muscleGroups = new Set<string>();
      const equipment = new Set<string>();
      const difficulties = new Set<string>();
      const movementPatterns = new Set<string>();
      
      result.data.forEach(exercise => {
        exercise.primary_muscle_groups?.forEach(mg => muscleGroups.add(mg));
        exercise.secondary_muscle_groups?.forEach(mg => muscleGroups.add(mg));
        exercise.equipment_type?.forEach(eq => equipment.add(eq));
        if (exercise.difficulty) difficulties.add(exercise.difficulty);
        if (exercise.movement_pattern) movementPatterns.add(exercise.movement_pattern);
      });
      
      return {
        muscleGroups: Array.from(muscleGroups).sort(),
        equipment: Array.from(equipment).sort(),
        difficulties: Array.from(difficulties).sort(),
        movementPatterns: Array.from(movementPatterns).sort()
      };
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}