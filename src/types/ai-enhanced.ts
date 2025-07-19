// AI Enhancement Type Definitions
import { WorkoutSession, ExerciseSet } from '@/types/workout';

export interface UserTrainingProfile {
  userId: string;
  trainingStyle: 'movement-based' | 'muscle-based' | 'performance-based' | 'mixed';
  preferredNamingStyle: 'descriptive' | 'motivational' | 'technical' | 'simple';
  workoutFrequency: number;
  averageDuration: number;
  favoriteExercises: string[];
  primaryMuscleGroups: string[];
  confidenceScore: number;
  lastAnalysis: Date;
}

export interface TrainingStyleAnalysis {
  primaryStyle: string;
  styleConfidence: number;
  characteristics: {
    exerciseVariety: number;
    focusConsistency: number;
    progressionPattern: string;
  };
  recommendations: string[];
}

export interface WorkoutNameSuggestion {
  name: string;
  reasoning: string;
  confidence: number;
  style: 'descriptive' | 'motivational' | 'technical' | 'simple';
  category: 'exercise-based' | 'muscle-based' | 'performance-based' | 'time-based';
}

export interface WorkoutInsight {
  id: string;
  type: 'achievement' | 'trend' | 'recommendation' | 'milestone';
  title: string;
  description: string;
  actionable?: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  metadata: Record<string, any>;
}

export interface AIPatternData {
  id: string;
  userId: string;
  patternType: 'naming_preference' | 'training_style' | 'exercise_selection' | 'timing_preference';
  patternData: Record<string, any>;
  confidenceScore: number;
  feedbackType?: 'accepted' | 'rejected' | 'modified';
  userFeedback?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfidenceScore {
  overall: number;
  factors: {
    dataQuality: number;
    patternConsistency: number;
    userFeedback: number;
    temporalStability: number;
  };
}

export interface UserFeedback {
  suggestionId: string;
  action: 'accepted' | 'rejected' | 'modified';
  originalSuggestion: string;
  userChoice?: string;
  context: Record<string, any>;
  timestamp: Date;
}

export interface NamingStrategy {
  style: 'descriptive' | 'motivational' | 'technical' | 'simple';
  patterns: {
    exerciseBased: string[];
    muscleBased: string[];
    performanceBased: string[];
    timeBased: string[];
  };
  userPreferences: Record<string, number>;
}

export interface PerformanceMetrics {
  responseTime: number;
  confidenceScore: number;
  userAcceptanceRate: number;
  patternAccuracy: number;
}

export interface AIPreferences {
  enableSmartNaming: boolean;
  enableInsights: boolean;
  enableRecommendations: boolean;
  confidenceThreshold: number;
  preferredNamingStyle: string;
  insightFrequency: 'high' | 'medium' | 'low';
  privacyLevel: 'full' | 'limited' | 'minimal';
}