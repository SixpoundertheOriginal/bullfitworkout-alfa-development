import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { WorkoutSession, ExerciseSet } from '@/types/workout';
import { 
  UserTrainingProfile, 
  WorkoutInsight, 
  WorkoutNameSuggestion, 
  AIPreferences 
} from '@/types/ai-enhanced';
import { SmartNamingService } from '@/services/smartNamingService';
import { InsightsEngine } from '@/services/insightsEngine';

export const useAIWorkoutRecommendations = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<WorkoutInsight[]>([]);
  const [userProfile, setUserProfile] = useState<UserTrainingProfile | null>(null);
  const [aiPreferences, setAiPreferences] = useState<AIPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const smartNamingService = SmartNamingService.getInstance();
  const insightsEngine = InsightsEngine.getInstance();

  // Load user AI preferences and profile
  useEffect(() => {
    if (user?.id) {
      loadUserAIData();
    }
  }, [user?.id]);

  const loadUserAIData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Load user profile with AI data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profileData) {
        // Extract AI preferences from existing training_preferences field
        const trainingPrefs = (profileData.training_preferences as any) || {};
        const aiPrefs = trainingPrefs.ai_preferences || {};
        
        setAiPreferences({
          enableSmartNaming: aiPrefs.enableSmartNaming !== false, // Default to true
          enableInsights: aiPrefs.enableInsights !== false, // Default to true
          enableRecommendations: aiPrefs.enableRecommendations !== false, // Default to true
          confidenceThreshold: aiPrefs.confidenceThreshold || 0.7,
          preferredNamingStyle: aiPrefs.preferredNamingStyle || 'descriptive',
          insightFrequency: aiPrefs.insightFrequency || 'medium',
          privacyLevel: aiPrefs.privacyLevel || 'full'
        });

        // Create user training profile
        const trainingProfile: UserTrainingProfile = {
          userId: user.id,
          trainingStyle: 'mixed', // Will be determined by analysis
          preferredNamingStyle: aiPrefs.preferredNamingStyle || 'descriptive',
          workoutFrequency: 0, // Will be calculated
          averageDuration: 0, // Will be calculated
          favoriteExercises: [],
          primaryMuscleGroups: [],
          confidenceScore: aiPrefs.patternConfidence || 0.0,
          lastAnalysis: aiPrefs.lastPatternAnalysis ? new Date(aiPrefs.lastPatternAnalysis) : new Date()
        };

        setUserProfile(trainingProfile);
      }
    } catch (err) {
      console.error('Error loading user AI data:', err);
      setError('Failed to load AI preferences');
    } finally {
      setLoading(false);
    }
  };

  const generateWorkoutInsights = useCallback(async () => {
    if (!user?.id || !aiPreferences?.enableInsights) return [];

    try {
      setLoading(true);
      
      // Fetch recent workout data
      const { data: workouts, error: workoutError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(20);

      if (workoutError) throw workoutError;

      const { data: exerciseSets, error: setsError } = await supabase
        .from('exercise_sets')
        .select('*')
        .in('workout_id', workouts?.map(w => w.id) || [])
        .order('created_at', { ascending: false });

      if (setsError) throw setsError;

      // Generate insights using AI engine
      const generatedInsights = await insightsEngine.generateWorkoutInsights(
        user.id,
        workouts || [],
        exerciseSets || [],
        userProfile || undefined
      );

      setInsights(generatedInsights);
      return generatedInsights;
    } catch (err) {
      console.error('Error generating workout insights:', err);
      setError('Failed to generate insights');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id, aiPreferences?.enableInsights, userProfile, insightsEngine]);

  const generateWorkoutNameSuggestions = useCallback(async (
    workout: WorkoutSession,
    exerciseSets: ExerciseSet[]
  ): Promise<WorkoutNameSuggestion[]> => {
    if (!aiPreferences?.enableSmartNaming) return [];

    try {
      const suggestions = await smartNamingService.generateNameSuggestions(
        workout,
        exerciseSets,
        userProfile || undefined
      );

      return suggestions.filter(s => s.confidence >= (aiPreferences.confidenceThreshold || 0.7));
    } catch (err) {
      console.error('Error generating workout name suggestions:', err);
      return [];
    }
  }, [aiPreferences, userProfile, smartNamingService]);

  const recordUserFeedback = useCallback(async (
    suggestionType: 'naming' | 'insight' | 'recommendation',
    suggestionId: string,
    feedback: 'accepted' | 'rejected' | 'modified',
    userChoice?: string
  ) => {
    if (!user?.id) return;

    try {
      // For now, we'll store feedback locally until the types are updated
      // This will be uncommented once the Supabase types include ai_workout_patterns
      /*
      await supabase
        .from('ai_workout_patterns')
        .insert({
          user_id: user.id,
          pattern_type: `${suggestionType}_feedback`,
          pattern_data: {
            suggestionId,
            feedback,
            userChoice,
            timestamp: new Date().toISOString()
          },
          confidence_score: feedback === 'accepted' ? 0.9 : feedback === 'modified' ? 0.7 : 0.3,
          feedback_type: feedback,
          user_feedback: { userChoice, timestamp: new Date().toISOString() }
        });
      */

      // Store feedback for naming suggestions
      if (suggestionType === 'naming' && userChoice) {
        await smartNamingService.learnFromUserChoice([], userChoice, user.id);
      }

    } catch (err) {
      console.error('Error recording user feedback:', err);
    }
  }, [user?.id, smartNamingService]);

  const updateAIPreferences = useCallback(async (newPreferences: Partial<AIPreferences>) => {
    if (!user?.id) return;

    try {
      const updatedPreferences = { ...aiPreferences, ...newPreferences };
      setAiPreferences(updatedPreferences);

      // Update user profile with new AI preferences in training_preferences
      const currentProfile = await supabase
        .from('user_profiles')
        .select('training_preferences')
        .eq('id', user.id)
        .single();

      const currentPrefs = (currentProfile.data?.training_preferences as any) || {};
      const updatedTrainingPrefs = {
        ...currentPrefs,
        ai_preferences: {
          ...currentPrefs.ai_preferences,
          ...updatedPreferences
        }
      };

      await supabase
        .from('user_profiles')
        .update({ training_preferences: updatedTrainingPrefs })
        .eq('id', user.id);

    } catch (err) {
      console.error('Error updating AI preferences:', err);
      setError('Failed to update preferences');
    }
  }, [user?.id, aiPreferences]);

  const analyzeUserPatterns = useCallback(async () => {
    if (!user?.id) return null;

    try {
      // Fetch user's workout history for pattern analysis
      const { data: workouts, error: workoutError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(50);

      if (workoutError) throw workoutError;

      const { data: exerciseSets, error: setsError } = await supabase
        .from('exercise_sets')
        .select('*')
        .in('workout_id', workouts?.map(w => w.id) || []);

      if (setsError) throw setsError;

      // Analyze patterns
      const workoutFrequency = workouts?.length || 0;
      const averageDuration = workouts?.reduce((sum, w) => sum + w.duration, 0) / Math.max(workouts?.length || 1, 1);
      
      // Analyze favorite exercises
      const exerciseCounts = (exerciseSets || []).reduce((acc, set) => {
        acc[set.exercise_name] = (acc[set.exercise_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const favoriteExercises = Object.entries(exerciseCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([exercise]) => exercise);

      // Update user profile
      const updatedProfile: UserTrainingProfile = {
        ...userProfile!,
        workoutFrequency: workoutFrequency / 4, // Weekly frequency approximation
        averageDuration,
        favoriteExercises,
        lastAnalysis: new Date()
      };

      setUserProfile(updatedProfile);

      // Update database with analysis results in training_preferences
      const currentProfile = await supabase
        .from('user_profiles')
        .select('training_preferences')
        .eq('id', user.id)
        .single();

      const currentPrefs = (currentProfile.data?.training_preferences as any) || {};
      const updatedTrainingPrefs = {
        ...currentPrefs,
        ai_preferences: {
          ...currentPrefs.ai_preferences,
          patternConfidence: 0.8,
          lastPatternAnalysis: new Date().toISOString()
        }
      };

      await supabase
        .from('user_profiles')
        .update({ training_preferences: updatedTrainingPrefs })
        .eq('id', user.id);

      return updatedProfile;
    } catch (err) {
      console.error('Error analyzing user patterns:', err);
      return null;
    }
  }, [user?.id, userProfile]);

  return {
    insights,
    userProfile,
    aiPreferences,
    loading,
    error,
    generateWorkoutInsights,
    generateWorkoutNameSuggestions,
    recordUserFeedback,
    updateAIPreferences,
    analyzeUserPatterns,
    refreshInsights: generateWorkoutInsights
  };
};