import { useState, useEffect, useCallback } from 'react';
import { useRestTimeAnalytics } from './useRestTimeAnalytics';

export interface RestSuggestion {
  suggestedTime: number;
  confidence: 'low' | 'medium' | 'high';
  reason: string;
}

export const useSmartRestSuggestions = () => {
  const { getRestSuggestion } = useRestTimeAnalytics();
  const [suggestions, setSuggestions] = useState<Record<string, RestSuggestion>>({});

  const getSuggestionForExercise = useCallback(async (
    exerciseName: string,
    previousRestTime?: number,
    setNumber?: number
  ): Promise<RestSuggestion> => {
    try {
      const historicalSuggestion = await getRestSuggestion(exerciseName);
      
      if (historicalSuggestion) {
        // High confidence if we have historical data
        return {
          suggestedTime: historicalSuggestion,
          confidence: 'high',
          reason: 'Based on your previous workouts'
        };
      }

      // Medium confidence if we have previous set data
      if (previousRestTime) {
        return {
          suggestedTime: previousRestTime,
          confidence: 'medium',
          reason: 'Based on your previous set'
        };
      }

      // Low confidence fallback based on exercise type
      const defaultRestTimes: Record<string, number> = {
        // Compound movements typically need more rest
        'squat': 180,
        'deadlift': 180,
        'bench': 150,
        'press': 150,
        'row': 120,
        'pull': 120,
        // Isolation movements need less rest
        'curl': 90,
        'extension': 90,
        'fly': 90,
        'raise': 60,
      };

      const exerciseKey = Object.keys(defaultRestTimes).find(key => 
        exerciseName.toLowerCase().includes(key)
      );
      
      const defaultTime = exerciseKey ? defaultRestTimes[exerciseKey] : 120;
      
      return {
        suggestedTime: defaultTime,
        confidence: 'low',
        reason: 'Based on exercise type'
      };
    } catch (error) {
      console.error('Error getting rest suggestion:', error);
      return {
        suggestedTime: 120,
        confidence: 'low',
        reason: 'Default suggestion'
      };
    }
  }, [getRestSuggestion]);

  const updateSuggestion = useCallback((exerciseName: string, suggestion: RestSuggestion) => {
    setSuggestions(prev => ({
      ...prev,
      [exerciseName]: suggestion
    }));
  }, []);

  const getSuggestion = useCallback((exerciseName: string) => {
    return suggestions[exerciseName];
  }, [suggestions]);

  return {
    getSuggestionForExercise,
    updateSuggestion,
    getSuggestion
  };
};