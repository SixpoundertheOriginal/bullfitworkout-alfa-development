import { TrainingFocus, TrainingGoals, EnhancedTrainingConfig } from '@/types/training-setup';
import { Exercise } from '@/types/exercise';
import { supabase } from '@/integrations/supabase/client';
import { OpenAIService } from '@/services/openAIService';

interface HistoricalWorkoutData {
  exercise_name: string;
  weight: number;
  reps: number;
  total_volume: number;
  frequency: number;
  avg_weight: number;
  max_weight: number;
  training_type?: string;
}

interface SmartTemplateResult {
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weight: number;
    restTime: number;
    category: 'primary' | 'accessory' | 'warmup';
  }>;
  estimatedDuration: number;
  estimatedTonnage: number;
  aiRecommendations?: string[];
}

export class SmartTemplateService {
  /**
   * Generate intelligent workout template based on user history and preferences
   */
  static async generateSmartTemplate(
    focus: TrainingFocus, 
    goals: TrainingGoals,
    userId: string
  ): Promise<SmartTemplateResult> {
    try {
      // Input validation with detailed logging
      if (!focus) {
        console.error('❌ SmartTemplate: Missing focus parameter');
        return this.generateFallbackTemplate(this.getDefaultFocus(), goals);
      }
      
      if (!focus.category) {
        console.error('❌ SmartTemplate: Missing focus.category:', focus);
        return this.generateFallbackTemplate(this.getDefaultFocus(), goals);
      }
      
      if (!goals) {
        console.error('❌ SmartTemplate: Missing goals parameter');
        return this.generateFallbackTemplate(focus, this.getDefaultGoals());
      }

      console.log('✅ SmartTemplate: Valid inputs received', { 
        focusCategory: focus.category, 
        targetTonnage: goals.targetTonnage 
      });

      // 1. Fetch user's historical workout data
      const historicalData = await this.fetchUserWorkoutHistory(userId, focus.category);
      
      // 2. Generate base exercise recommendations
      const baseExercises = await this.selectOptimalExercises(focus, historicalData);
      
      // 3. Calculate smart defaults for sets/reps/weight
      const templateExercises = this.calculateSmartDefaults(baseExercises, goals, historicalData);
      
      // 4. Get AI-enhanced recommendations if available
      const aiRecommendations = await this.getAIEnhancements(focus, goals, templateExercises);
      
      // 5. Calculate estimates
      const estimatedTonnage = this.calculateEstimatedTonnage(templateExercises);
      const estimatedDuration = this.estimateDuration(templateExercises, goals.timeBudget);
      
      return {
        exercises: templateExercises,
        estimatedDuration,
        estimatedTonnage,
        aiRecommendations
      };
    } catch (error) {
      console.error('❌ SmartTemplate generation failed:', error);
      // Ensure fallback has valid data
      const safeFocus = focus && focus.category ? focus : this.getDefaultFocus();
      const safeGoals = goals || this.getDefaultGoals();
      return this.generateFallbackTemplate(safeFocus, safeGoals);
    }
  }

  /**
   * Fetch user's workout history for specific training focus
   */
  private static async fetchUserWorkoutHistory(
    userId: string, 
    category: string
  ): Promise<HistoricalWorkoutData[]> {
    try {
      // For now, return empty array to use fallback logic
      // TODO: Implement proper database queries once schema is confirmed
      console.log(`Fetching workout history for user ${userId}, category ${category}`);
      return [];
    } catch (error) {
      console.warn('Error fetching workout history:', error);
      return [];
    }
  }

  /**
   * Select optimal exercises based on focus and historical performance
   */
  private static async selectOptimalExercises(
    focus: TrainingFocus,
    historicalData: HistoricalWorkoutData[]
  ): Promise<string[]> {
    // Get exercises that match the training focus
    const focusExercises = focus.recommendedExercises || [];
    
    // Sort historical exercises by total volume and frequency
    const topHistoricalExercises = historicalData
      .filter(data => focusExercises.some(ex => 
        data.exercise_name.toLowerCase().includes(ex.toLowerCase()) ||
        ex.toLowerCase().includes(data.exercise_name.toLowerCase())
      ))
      .sort((a, b) => (b.total_volume * b.frequency) - (a.total_volume * a.frequency))
      .slice(0, 4)
      .map(data => data.exercise_name);

    // Combine recommended and historical, prioritizing historical performance
    const selectedExercises = new Set([
      ...topHistoricalExercises,
      ...focusExercises.slice(0, 6 - topHistoricalExercises.length)
    ]);

    return Array.from(selectedExercises).slice(0, 6);
  }

  /**
   * Calculate smart defaults for sets, reps, and weights
   */
  private static calculateSmartDefaults(
    exercises: string[],
    goals: TrainingGoals,
    historicalData: HistoricalWorkoutData[]
  ): Array<{
    name: string;
    sets: number;
    reps: number;
    weight: number;
    restTime: number;
    category: 'primary' | 'accessory' | 'warmup';
  }> {
    return exercises.map((exerciseName, index) => {
      const historicalStats = historicalData.find(data => 
        data.exercise_name.toLowerCase() === exerciseName.toLowerCase()
      );

      // Determine exercise category
      const category: 'primary' | 'accessory' | 'warmup' = 
        index < 2 ? 'primary' : index < 4 ? 'accessory' : 'warmup';

      // Calculate sets based on tonnage goals and exercise category
      const baseSets = category === 'primary' ? 4 : category === 'accessory' ? 3 : 2;
      const tonnageMultiplier = goals.targetTonnage / 5000; // Normalize around 5kg baseline
      const sets = Math.max(2, Math.min(6, Math.round(baseSets * tonnageMultiplier)));

      // Calculate reps based on rep range preference
      const repRange = goals.repRange || 'Hypertrophy (8-12)';
      const reps = repRange === 'Strength (3-6)' ? 5 : 
                   repRange === 'Hypertrophy (8-12)' ? 10 : 15;

      // Calculate weight based on historical data or smart defaults
      let weight = 50; // Default weight
      if (historicalStats) {
        // Use 85% of average weight for sustainable progression
        weight = Math.round(historicalStats.avg_weight * 0.85);
      } else {
        // Smart defaults based on exercise type
        weight = this.getDefaultWeight(exerciseName, category);
      }

      // Calculate rest time based on training style
      const baseRestTime = goals.restStyle === 'Strict' ? 120 : 
                          goals.restStyle === 'Adaptive' ? 90 : 60;
      const restTime = category === 'primary' ? baseRestTime : baseRestTime * 0.75;

      return {
        name: exerciseName,
        sets,
        reps,
        weight,
        restTime,
        category
      };
    });
  }

  /**
   * Get AI-enhanced workout recommendations
   */
  private static async getAIEnhancements(
    focus: TrainingFocus,
    goals: TrainingGoals,
    exercises: any[]
  ): Promise<string[]> {
    try {
      const openAIService = OpenAIService.getInstance();
      if (!openAIService.isAvailable()) {
        return [];
      }

      const prompt = `As a fitness expert, analyze this workout plan and provide 3 specific improvements:

Focus: ${focus.category} (${focus.primaryMuscles.join(', ')})
Goals: ${goals.targetTonnage}kg tonnage, ${goals.timeBudget}min, ${goals.repRange} rep range
Exercises: ${exercises.map(e => `${e.name} (${e.sets}x${e.reps} @ ${e.weight}kg)`).join(', ')}

Provide exactly 3 bullet points with specific, actionable recommendations for optimization.`;

      // Create a simple workout data structure for the AI service
      const workoutData = {
        exercises: exercises.map(e => e.name),
        duration: goals.timeBudget || 45,
        training_type: focus.category,
        muscle_groups: focus.primaryMuscles,
        total_sets: exercises.reduce((sum, e) => sum + e.sets, 0)
      };

      const response = await openAIService.generateWorkoutNames(workoutData);
      
      // Extract recommendations from AI response
      return response.suggestions
        .map(suggestion => suggestion.reasoning)
        .slice(0, 3);
    } catch (error) {
      console.warn('AI enhancement failed:', error);
      return [];
    }
  }

  /**
   * Calculate estimated tonnage for the workout
   */
  private static calculateEstimatedTonnage(exercises: any[]): number {
    return exercises.reduce((total, exercise) => {
      return total + (exercise.sets * exercise.reps * exercise.weight);
    }, 0);
  }

  /**
   * Estimate workout duration based on exercises and time budget
   */
  private static estimateDuration(exercises: any[], timeBudget: number): number {
    // Calculate based on sets, rest times, and exercise complexity
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
    const avgRestTime = exercises.reduce((sum, ex) => sum + ex.restTime, 0) / exercises.length;
    
    // Estimate: 45 seconds per set + rest time + 5min warmup
    const estimatedMinutes = Math.round((totalSets * 0.75) + (totalSets * avgRestTime / 60) + 5);
    
    // Cap at time budget
    return Math.min(estimatedMinutes, timeBudget);
  }

  /**
   * Get default weight for exercise type
   */
  private static getDefaultWeight(exerciseName: string, category: 'primary' | 'accessory' | 'warmup'): number {
    const exercise = exerciseName.toLowerCase();
    
    // Bodyweight exercises
    if (exercise.includes('pull-up') || exercise.includes('pullup') || 
        exercise.includes('dip') || exercise.includes('push-up')) {
      return 0;
    }
    
    // Heavy compound movements
    if (exercise.includes('deadlift') || exercise.includes('squat') || 
        exercise.includes('bench')) {
      return category === 'primary' ? 80 : 60;
    }
    
    // Medium weights for accessories
    if (exercise.includes('row') || exercise.includes('press') ||
        exercise.includes('curl')) {
      return category === 'primary' ? 50 : 30;
    }
    
    // Light weights for isolation
    return 20;
  }

  /**
   * Generate fallback template when smart generation fails
   */
  private static generateFallbackTemplate(focus: TrainingFocus, goals: TrainingGoals): SmartTemplateResult {
    // Ensure we have valid exercises array
    const exercises = focus.recommendedExercises || this.getDefaultExercises(focus.category);
    
    const fallbackExercises = exercises.slice(0, 4).map((name, index) => ({
      name,
      sets: 3,
      reps: goals.repRange === 'Strength (3-6)' ? 5 : 10,
      weight: this.getDefaultWeight(name, index < 2 ? 'primary' : 'accessory'),
      restTime: 90,
      category: (index < 2 ? 'primary' : 'accessory') as 'primary' | 'accessory'
    }));

    return {
      exercises: fallbackExercises,
      estimatedDuration: goals.timeBudget || 45,
      estimatedTonnage: this.calculateEstimatedTonnage(fallbackExercises),
      aiRecommendations: ['Start with comfortable weights and focus on proper form']
    };
  }

  /**
   * Get default focus when none provided
   */
  private static getDefaultFocus(): TrainingFocus {
    return {
      category: 'Full Body',
      description: 'Balanced full-body workout',
      subFocus: ['General fitness'],
      primaryMuscles: ['chest', 'back', 'legs'],
      recommendedExercises: ['Push-ups', 'Pull-ups', 'Squats', 'Plank']
    };
  }

  /**
   * Get default goals when none provided
   */
  private static getDefaultGoals(): TrainingGoals {
    return {
      targetTonnage: 3000,
      timeBudget: 45,
      repRange: 'Hypertrophy (8-12)',
      structure: 'Straight Sets',
      restStyle: 'Adaptive',
      tonnageLevel: 'Moderate',
      includeIsometrics: false,
      includeUnilateral: false,
      includeCore: true
    };
  }

  /**
   * Get default exercises for a category
   */
  private static getDefaultExercises(category: string): string[] {
    const defaultExercises: Record<string, string[]> = {
      'Push': ['Push-ups', 'Dips', 'Incline Push-ups', 'Pike Push-ups'],
      'Pull': ['Pull-ups', 'Chin-ups', 'Rows', 'Lat Pulldowns'],
      'Legs': ['Squats', 'Lunges', 'Calf Raises', 'Leg Press'],
      'Full Body': ['Burpees', 'Mountain Climbers', 'Jumping Jacks', 'Planks'],
      'Arms': ['Bicep Curls', 'Tricep Dips', 'Hammer Curls', 'Close Push-ups'],
      'Core': ['Planks', 'Crunches', 'Leg Raises', 'Russian Twists']
    };
    
    return defaultExercises[category] || defaultExercises['Full Body'];
  }
}