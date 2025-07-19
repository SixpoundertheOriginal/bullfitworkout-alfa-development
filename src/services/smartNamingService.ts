import { WorkoutSession, ExerciseSet } from '@/types/workout';
import { WorkoutNameSuggestion, UserTrainingProfile, NamingStrategy, UserFeedback } from '@/types/ai-enhanced';
import { supabase } from '@/integrations/supabase/client';
import { OpenAIService } from './openAIService';

export class SmartNamingService {
  private static instance: SmartNamingService;
  private openAIService: OpenAIService;
  
  static getInstance(): SmartNamingService {
    if (!SmartNamingService.instance) {
      SmartNamingService.instance = new SmartNamingService();
    }
    return SmartNamingService.instance;
  }

  constructor() {
    this.openAIService = OpenAIService.getInstance();
  }

  async generateNameSuggestions(
    workout: WorkoutSession,
    exerciseSets: ExerciseSet[],
    userProfile?: UserTrainingProfile
  ): Promise<WorkoutNameSuggestion[]> {
    const startTime = performance.now();
    
    try {
      const workoutAnalysis = this.analyzeWorkout(workout, exerciseSets);
      
      // Try AI-powered suggestions first
      if (this.openAIService.isAvailable()) {
        try {
          const aiSuggestions = await this.generateAISuggestions(workoutAnalysis, userProfile);
          if (aiSuggestions.length > 0) {
            // Supplement with rule-based suggestions for variety
            const namingStrategy = await this.getNamingStrategy(userProfile);
            const ruleSuggestions = this.generateRuleBasedSuggestions(workoutAnalysis, namingStrategy);
            const combinedSuggestions = [...aiSuggestions, ...ruleSuggestions.slice(0, 2)];
            
            const responseTime = performance.now() - startTime;
            this.trackPerformance('generateNameSuggestions', responseTime, combinedSuggestions[0]?.confidence || 0);
            
            return combinedSuggestions.slice(0, 5);
          }
        } catch (aiError) {
          console.warn('AI suggestions failed, falling back to rule-based:', aiError);
        }
      }

      // Fallback to rule-based suggestions
      const namingStrategy = await this.getNamingStrategy(userProfile);
      const suggestions: WorkoutNameSuggestion[] = [
        ...this.generateExerciseBasedNames(workoutAnalysis, namingStrategy),
        ...this.generateMuscleBasedNames(workoutAnalysis, namingStrategy),
        ...this.generatePerformanceBasedNames(workoutAnalysis, namingStrategy),
        ...this.generateTimeBasedNames(workoutAnalysis, namingStrategy)
      ];

      // Sort by confidence and user preference alignment
      const sortedSuggestions = suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5); // Return top 5 suggestions

      const responseTime = performance.now() - startTime;
      this.trackPerformance('generateNameSuggestions', responseTime, sortedSuggestions[0]?.confidence || 0);
      
      return sortedSuggestions;
    } catch (error) {
      console.error('Error generating name suggestions:', error);
      return this.getFallbackSuggestions(workout, exerciseSets);
    }
  }

  async learnFromUserChoice(
    originalSuggestions: WorkoutNameSuggestion[],
    userChoice: string,
    userId: string
  ): Promise<void> {
    try {
      const feedback: UserFeedback = {
        suggestionId: `naming_${Date.now()}`,
        action: originalSuggestions.some(s => s.name === userChoice) ? 'accepted' : 'modified',
        originalSuggestion: originalSuggestions[0]?.name || '',
        userChoice,
        context: {
          suggestions: originalSuggestions,
          timestamp: new Date()
        },
        timestamp: new Date()
      };

      // Store feedback in database for learning
      // TODO: Uncomment once Supabase types are regenerated with ai_workout_patterns table
      /*
      await supabase
        .from('ai_workout_patterns')
        .insert({
          user_id: userId,
          pattern_type: 'naming_preference',
          pattern_data: {
            feedback,
            suggestions: originalSuggestions,
            userChoice
          },
          confidence_score: this.calculateLearningConfidence(feedback),
          feedback_type: feedback.action,
          user_feedback: { userChoice, timestamp: feedback.timestamp }
        });
      */
      
      // For now, store in localStorage for persistence
      const feedbackKey = `ai_naming_feedback_${userId}`;
      const existingFeedback = JSON.parse(localStorage.getItem(feedbackKey) || '[]');
      existingFeedback.push({
        feedback,
        suggestions: originalSuggestions,
        userChoice,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(feedbackKey, JSON.stringify(existingFeedback.slice(-50))); // Keep last 50 entries

    } catch (error) {
      console.error('Error learning from user choice:', error);
    }
  }

  private analyzeWorkout(workout: WorkoutSession, exerciseSets: ExerciseSet[]) {
    const exerciseNames = [...new Set(exerciseSets.map(set => set.exercise_name))];
    const totalVolume = exerciseSets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
    const avgWeight = exerciseSets.reduce((sum, set) => sum + set.weight, 0) / exerciseSets.length;
    const totalSets = exerciseSets.length;
    
    // Analyze muscle groups based on exercise names
    const muscleGroups = this.inferMuscleGroups(exerciseNames);
    const dominantMuscleGroup = this.getDominantMuscleGroup(muscleGroups);
    
    // Analyze workout characteristics
    const isStrengthFocused = avgWeight > 50; // Threshold can be adjusted
    const isVolumeFocused = totalSets > 15;
    const isCompoundFocused = this.hasCompoundMovements(exerciseNames);
    
    return {
      exerciseNames,
      muscleGroups,
      dominantMuscleGroup,
      totalVolume,
      avgWeight,
      totalSets,
      duration: workout.duration,
      trainingType: workout.training_type,
      isStrengthFocused,
      isVolumeFocused,
      isCompoundFocused,
      exerciseCount: exerciseNames.length
    };
  }

  private async getNamingStrategy(userProfile?: UserTrainingProfile): Promise<NamingStrategy> {
    const defaultStrategy: NamingStrategy = {
      style: userProfile?.preferredNamingStyle || 'descriptive',
      patterns: {
        exerciseBased: ['${exercise} Power Session', '${exercise} Focus', 'Heavy ${exercise}', '${exercise} Builder'],
        muscleBased: ['${muscle} Blast', '${muscle} Power Hour', '${muscle} Strength', '${muscle} Focus'],
        performanceBased: ['Power Session', 'Volume Builder', 'Strength Focus', 'Endurance Push'],
        timeBased: ['Quick ${duration}min', 'Express ${duration}min', '${duration}min Power']
      },
      userPreferences: userProfile ? this.extractUserPreferences(userProfile) : {}
    };

    return defaultStrategy;
  }

  private generateExerciseBasedNames(analysis: any, strategy: NamingStrategy): WorkoutNameSuggestion[] {
    const { exerciseNames, exerciseCount } = analysis;
    const suggestions: WorkoutNameSuggestion[] = [];
    
    if (exerciseCount === 1) {
      const exercise = exerciseNames[0];
      suggestions.push({
        name: `${exercise} Power Session`,
        reasoning: `Single exercise focus on ${exercise}`,
        confidence: 0.9,
        style: strategy.style,
        category: 'exercise-based'
      });
    } else if (exerciseCount <= 3) {
      const mainExercise = exerciseNames[0];
      suggestions.push({
        name: `${mainExercise} & Friends`,
        reasoning: `Primary focus on ${mainExercise} with supporting exercises`,
        confidence: 0.8,
        style: strategy.style,
        category: 'exercise-based'
      });
    }

    return suggestions;
  }

  private generateMuscleBasedNames(analysis: any, strategy: NamingStrategy): WorkoutNameSuggestion[] {
    const { dominantMuscleGroup, muscleGroups } = analysis;
    const suggestions: WorkoutNameSuggestion[] = [];
    
    if (dominantMuscleGroup && muscleGroups[dominantMuscleGroup] > 2) {
      suggestions.push({
        name: `${dominantMuscleGroup} Power Hour`,
        reasoning: `Primarily targets ${dominantMuscleGroup} muscles`,
        confidence: 0.85,
        style: strategy.style,
        category: 'muscle-based'
      });
    }

    return suggestions;
  }

  private generatePerformanceBasedNames(analysis: any, strategy: NamingStrategy): WorkoutNameSuggestion[] {
    const { isStrengthFocused, isVolumeFocused, totalVolume } = analysis;
    const suggestions: WorkoutNameSuggestion[] = [];
    
    if (isStrengthFocused) {
      suggestions.push({
        name: 'Strength Builder',
        reasoning: 'Heavy weights focus for strength development',
        confidence: 0.8,
        style: strategy.style,
        category: 'performance-based'
      });
    }
    
    if (isVolumeFocused) {
      suggestions.push({
        name: 'Volume Crusher',
        reasoning: 'High volume training for muscle growth',
        confidence: 0.8,
        style: strategy.style,
        category: 'performance-based'
      });
    }

    return suggestions;
  }

  private generateTimeBasedNames(analysis: any, strategy: NamingStrategy): WorkoutNameSuggestion[] {
    const { duration } = analysis;
    const suggestions: WorkoutNameSuggestion[] = [];
    
    if (duration < 30) {
      suggestions.push({
        name: `Express ${duration}min`,
        reasoning: 'Quick, efficient workout session',
        confidence: 0.75,
        style: strategy.style,
        category: 'time-based'
      });
    } else if (duration > 60) {
      suggestions.push({
        name: `Marathon ${Math.round(duration/60)}hr`,
        reasoning: 'Extended training session',
        confidence: 0.75,
        style: strategy.style,
        category: 'time-based'
      });
    }

    return suggestions;
  }

  private getFallbackSuggestions(workout: WorkoutSession, exerciseSets: ExerciseSet[]): WorkoutNameSuggestion[] {
    const exerciseCount = new Set(exerciseSets.map(s => s.exercise_name)).size;
    
    return [
      {
        name: `${workout.training_type} Session`,
        reasoning: 'Based on training type',
        confidence: 0.6,
        style: 'simple',
        category: 'exercise-based'
      },
      {
        name: `${exerciseCount} Exercise Workout`,
        reasoning: 'Based on exercise count',
        confidence: 0.5,
        style: 'simple',
        category: 'exercise-based'
      }
    ];
  }

  private inferMuscleGroups(exerciseNames: string[]): Record<string, number> {
    const muscleMap: Record<string, string[]> = {
      'Chest': ['bench', 'press', 'fly', 'push up', 'dips'],
      'Back': ['row', 'pull', 'lat', 'deadlift', 'chin'],
      'Shoulders': ['shoulder', 'raise', 'press', 'lateral'],
      'Arms': ['curl', 'tricep', 'bicep', 'extension'],
      'Legs': ['squat', 'lunge', 'leg', 'calf', 'thigh'],
      'Core': ['plank', 'crunch', 'abs', 'core', 'sit up']
    };

    const groups: Record<string, number> = {};
    
    exerciseNames.forEach(exercise => {
      const lowerExercise = exercise.toLowerCase();
      Object.entries(muscleMap).forEach(([muscle, keywords]) => {
        if (keywords.some(keyword => lowerExercise.includes(keyword))) {
          groups[muscle] = (groups[muscle] || 0) + 1;
        }
      });
    });

    return groups;
  }

  private getDominantMuscleGroup(muscleGroups: Record<string, number>): string | null {
    const entries = Object.entries(muscleGroups);
    if (entries.length === 0) return null;
    
    const dominant = entries.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );
    
    return dominant[1] > 1 ? dominant[0] : null;
  }

  private hasCompoundMovements(exerciseNames: string[]): boolean {
    const compoundKeywords = ['squat', 'deadlift', 'bench', 'press', 'row', 'pull up', 'chin up'];
    return exerciseNames.some(exercise => 
      compoundKeywords.some(keyword => 
        exercise.toLowerCase().includes(keyword)
      )
    );
  }

  private extractUserPreferences(userProfile: UserTrainingProfile): Record<string, number> {
    // Extract preferences from user's historical choices
    return {
      exerciseBased: 0.3,
      muscleBased: 0.3,
      performanceBased: 0.2,
      timeBased: 0.2
    };
  }

  private calculateLearningConfidence(feedback: UserFeedback): number {
    // Calculate confidence based on feedback quality and consistency
    let confidence = 0.5; // Base confidence
    
    if (feedback.action === 'accepted') confidence += 0.3;
    if (feedback.action === 'modified') confidence += 0.1;
    if (feedback.userChoice && feedback.userChoice.length > 3) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private trackPerformance(operation: string, responseTime: number, confidence: number): void {
    // Track performance metrics for monitoring
    if (responseTime > 200) {
      console.warn(`SmartNamingService.${operation} took ${responseTime}ms (>200ms threshold)`);
    }
    
    // Could send to analytics service here
    // analytics.track('ai_performance', { operation, responseTime, confidence });
  }

  private async generateAISuggestions(workoutAnalysis: any, userProfile?: UserTrainingProfile): Promise<WorkoutNameSuggestion[]> {
    try {
      // Convert workout analysis to safe data for OpenAI
      const safeWorkoutData = {
        exercises: workoutAnalysis.exerciseNames,
        duration: workoutAnalysis.duration,
        training_type: workoutAnalysis.trainingType,
        muscle_groups: Object.keys(workoutAnalysis.muscleGroups),
        total_sets: workoutAnalysis.totalSets,
        avg_weight: workoutAnalysis.avgWeight,
        is_strength_focused: workoutAnalysis.isStrengthFocused
      };

      const openaiResponse = await this.openAIService.generateWorkoutNames(safeWorkoutData);
      
      // Convert OpenAI response to WorkoutNameSuggestion format
      return openaiResponse.suggestions.map(suggestion => ({
        name: suggestion.name,
        reasoning: suggestion.reasoning,
        confidence: Math.min(suggestion.confidence, 0.95), // Cap AI confidence slightly below perfect
        style: suggestion.style,
        category: this.determineCategory(suggestion.style)
      }));
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
      return [];
    }
  }

  private generateRuleBasedSuggestions(workoutAnalysis: any, strategy: NamingStrategy): WorkoutNameSuggestion[] {
    const suggestions: WorkoutNameSuggestion[] = [
      ...this.generateExerciseBasedNames(workoutAnalysis, strategy),
      ...this.generateMuscleBasedNames(workoutAnalysis, strategy),
      ...this.generatePerformanceBasedNames(workoutAnalysis, strategy),
      ...this.generateTimeBasedNames(workoutAnalysis, strategy)
    ];

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private determineCategory(style: string): 'exercise-based' | 'muscle-based' | 'performance-based' | 'time-based' {
    switch (style) {
      case 'technical': return 'exercise-based';
      case 'motivational': return 'performance-based';
      case 'descriptive': return 'muscle-based';
      case 'creative': return 'time-based';
      default: return 'exercise-based';
    }
  }
}