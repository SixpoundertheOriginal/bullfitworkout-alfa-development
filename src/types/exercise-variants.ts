export interface ExerciseVariant {
  id: string;
  base_exercise_id: string;
  user_id: string;
  variant_name: string;
  grip_type?: 'overhand' | 'underhand' | 'neutral' | 'mixed' | 'hook';
  grip_width?: 'shoulder_width' | 'wide' | 'close' | 'extra_wide' | 'narrow';
  technique_type?: 'standard' | 'weighted' | 'unilateral' | 'explosive' | 'isometric' | 'pause_rep' | 'cluster';
  range_of_motion?: 'full' | 'top_half' | 'bottom_half' | 'dead_hang' | 'partial';
  tempo?: string; // Format: "3-1-2-0" (eccentric-pause-concentric-pause)
  assistance_type?: 'resistance_band' | 'rest_pause' | 'cluster_sets' | 'assisted' | 'deficit' | 'elevated';
  difficulty_modifier: number;
  progression_order?: number;
  ai_recommended: boolean;
  description?: string;
  instructions?: any;
  tips?: string[];
  created_at: string;
  updated_at: string;
}

export interface ExerciseRecommendation {
  id: string;
  user_id: string;
  exercise_id: string;
  variant_id?: string;
  recommendation_type: 'weakness_target' | 'progression' | 'recovery' | 'volume_match';
  confidence_score: number;
  reasoning?: string;
  created_at: string;
  expires_at?: string;
}

export interface ExerciseVariantAnalytics {
  id: string;
  user_id: string;
  exercise_id: string;
  variant_id?: string;
  total_volume: number;
  max_weight: number;
  total_reps: number;
  total_sets: number;
  average_rpe?: number;
  last_performed_at?: string;
  progression_trend?: 'improving' | 'stable' | 'declining';
  personal_record?: any;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface EnhancedExerciseSet {
  id: string;
  workout_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  completed: boolean;
  set_number: number;
  rest_time?: number;
  variant_id?: string;
  tempo?: string;
  range_of_motion?: string;
  added_weight?: number;
  assistance_used?: string;
  rpe?: number;
  notes?: string;
  created_at: string;
  failure_point?: 'none' | 'technical' | 'muscular' | null;
  form_score?: number | null;
}

export interface VariantSelectionData {
  variant_id?: string;
  grip_type?: ExerciseVariant['grip_type'];
  grip_width?: ExerciseVariant['grip_width'];
  technique_type?: ExerciseVariant['technique_type'];
  range_of_motion?: ExerciseVariant['range_of_motion'];
  tempo?: string;
  assistance_type?: ExerciseVariant['assistance_type'];
  added_weight?: number;
  rpe?: number;
  notes?: string;
}