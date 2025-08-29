export interface ExerciseSet {
  id: string;
  weight: number;
  reps: number;
  duration?: number;
  restTime?: number; // Properly defined restTime property
  completed: boolean;
  isEditing?: boolean;
  set_number: number;
  exercise_name: string;
  workout_id: string;
  exercise_id?: string;
  weightCalculation?: WeightCalculation;
  metadata?: Record<string, any>; // Add metadata property for RPE and other set-specific data
}

export type MuscleGroup = 
  | 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core' | 'cardio' | 'full body'
  | 'biceps' | 'triceps' | 'forearms' | 'traps' | 'lats' | 'glutes' | 'hamstrings' 
  | 'quads' | 'calves' | 'abs' | 'obliques' | 'lower back';

export type EquipmentType = 
  | 'barbell' | 'dumbbell' | 'kettlebell' | 'cable' | 'machine' | 'bodyweight' 
  | 'resistance band' | 'smith machine' | 'box' | 'bench' | 'ab wheel' | 'rings'
  | 'trx' | 'battle ropes' | 'medicine ball' | 'foam roller' | 'parallettes'
  | 'pull up bar' | 'dip station' | 'suspension trainer' | 'slider discs'
  | 'bosu ball' | 'stability ball' | 'sandbag' | 'weighted vest' | 'other';

export type MovementPattern =
  | 'push' | 'pull' | 'squat' | 'lunge' | 'hinge' | 'core' | 'carry' | 'isometric';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type ExerciseType = 'reps' | 'time' | 'hold' | 'distance';

// Enhanced loading type for better metrics calculation
export type LoadingType = 
  | 'bodyweight' | 'barbell' | 'dumbbell' | 'kettlebell' | 'cable'
  | 'machine' | 'resistance band' | 'smithMachine' | 'external';

// Exercise variants for progression tracking
export type VariantCategory = 
  | 'standard' | 'incline' | 'decline' | 'narrow' | 'wide' 
  | 'assisted' | 'weighted' | 'unilateral' | 'explosive';

export interface Exercise {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  description: string;
  primary_muscle_groups: MuscleGroup[];
  secondary_muscle_groups: MuscleGroup[];
  equipment_type: EquipmentType[];
  movement_pattern: MovementPattern;
  difficulty: Difficulty;
  instructions: Record<string, any>;
  is_compound: boolean;
  tips: string[];
  variations: string[];
  aliases?: string[];
  metadata: Record<string, any>;

  // Enhanced exercise schema properties for better metrics calculation
  loading_type?: LoadingType;
  estimated_load_percent?: number; // For bodyweight exercises (% of bodyweight)
  variant_category?: VariantCategory;
  type: ExerciseType;
  is_bodyweight: boolean;
  bw_multiplier?: number | null;
  static_posture_factor?: number | null;
  energy_cost_factor?: number | null;
  
  // Add missing properties for compatibility
  equipment_needed?: string;
  grip_types?: string[];
  techniques?: string[];
}

export const COMMON_MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'full body',
  'biceps', 'triceps', 'forearms', 'traps', 'lats', 'glutes', 'hamstrings',
  'quads', 'calves', 'abs', 'obliques', 'lower back'
];

export const COMMON_EQUIPMENT: EquipmentType[] = [
  'barbell', 'dumbbell', 'kettlebell', 'cable', 'machine', 'bodyweight',
  'resistance band', 'smith machine', 'box', 'bench', 'ab wheel', 'rings',
  'trx', 'battle ropes', 'medicine ball', 'foam roller', 'parallettes',
  'pull up bar', 'dip station', 'suspension trainer', 'slider discs',
  'bosu ball', 'stability ball', 'sandbag', 'weighted vest', 'other'
];

export const MOVEMENT_PATTERNS: MovementPattern[] = [
  'push', 'pull', 'squat', 'lunge', 'hinge', 'core', 'carry', 'isometric'
];

export const DIFFICULTY_LEVELS: Difficulty[] = [
  'beginner', 'intermediate', 'advanced', 'expert'
];

export const LOADING_TYPES: LoadingType[] = [
  'bodyweight', 'barbell', 'dumbbell', 'kettlebell', 'cable',
  'machine', 'resistance band', 'smithMachine', 'external'
];

export const VARIANT_CATEGORIES: VariantCategory[] = [
  'standard', 'incline', 'decline', 'narrow', 'wide', 
  'assisted', 'weighted', 'unilateral', 'explosive'
];

export interface LoadFactorMapping {
  name: string;
  factor: number;
  description?: string;
}

export const EXERCISE_LOAD_FACTORS: LoadFactorMapping[] = [
  { name: "Pull-ups", factor: 1.0, description: "Full bodyweight" },
  { name: "Chin-ups", factor: 1.0, description: "Full bodyweight" },
  { name: "Dips", factor: 1.0, description: "Full bodyweight" },
  { name: "Push-ups", factor: 0.65, description: "~65% of bodyweight" },
  { name: "Pike Push-ups", factor: 0.7, description: "~70% of bodyweight" },
  { name: "Diamond Push-ups", factor: 0.65, description: "~65% of bodyweight" },
  { name: "Decline Push-ups", factor: 0.7, description: "~70% of bodyweight" },
  { name: "Incline Push-ups", factor: 0.5, description: "~50% of bodyweight" },
  { name: "Inverted Rows", factor: 0.8, description: "~80% of bodyweight" },
  { name: "Leg Raises", factor: 0.5, description: "Lower body engagement" },
  { name: "Plank", factor: 0.6, description: "Isometric core engagement" },
  { name: "Side Plank", factor: 0.5, description: "Isometric side core engagement" },
  { name: "L-Sit", factor: 0.7, description: "Advanced isometric core hold" },
  { name: "Handstand", factor: 1.0, description: "Full bodyweight inverted" },
  { name: "Handstand Push-ups", factor: 1.0, description: "Full bodyweight inverted press" },
  { name: "Pistol Squats", factor: 0.8, description: "Single leg squat" },
  { name: "Lunges", factor: 0.6, description: "Bodyweight plus forward momentum" },
  { name: "Burpees", factor: 1.0, description: "Full body dynamic movement" },
  { name: "Mountain Climbers", factor: 0.6, description: "Dynamic core and leg movement" },
  { name: "Bodyweight Squats", factor: 0.65, description: "Basic lower body movement" }
];

export interface WeightCalculation {
  value: number;
  isAuto: boolean;
  source: 'user' | 'auto' | 'default';
}

export const isBodyweightExercise = (exercise: Exercise): boolean => {
  return (
    exercise.is_bodyweight === true ||
    exercise.equipment_type.includes('bodyweight') ||
    exercise.loading_type === 'bodyweight' ||
    exercise.movement_pattern === 'isometric'
  );
};

// Helper function to get the load factor for a bodyweight exercise
export const getExerciseLoadFactor = (exercise: Exercise, userWeight: number = 70): number => {
  if (!isBodyweightExercise(exercise)) {
    return 0; // Not applicable for non-bodyweight exercises
  }

  // First check if the exercise has a directly specified load factor
  if (typeof exercise.bw_multiplier === 'number') {
    return exercise.bw_multiplier;
  }

  // Then check if it has an estimated load percentage
  if (typeof exercise.estimated_load_percent === 'number') {
    return exercise.estimated_load_percent / 100;
  }

  // Default to 0.65 (common for many bodyweight exercises) if no specific factor found
  return 0.65;
};

// Helper function to calculate effective weight for an exercise
export const calculateEffectiveWeight = (
  exercise: Exercise,
  inputWeight: number,
  userBodyWeight: number
): number => {
  // For regular weighted exercises, use the input weight
  if (!isBodyweightExercise(exercise)) {
    return inputWeight;
  }
  
  // For bodyweight exercises with additional weight
  if (inputWeight > 0) {
    // This is a weighted bodyweight exercise (e.g., weighted pull-ups)
    const loadFactor = getExerciseLoadFactor(exercise, userBodyWeight);
    return (userBodyWeight * loadFactor) + inputWeight;
  } 
  
  // For pure bodyweight exercises
  const loadFactor = getExerciseLoadFactor(exercise, userBodyWeight);
  return userBodyWeight * loadFactor;
};

// Helper for determining next progression in an exercise based on variant category
export const getSuggestedProgressionVariant = (
  exercise: Exercise,
  currentDifficulty: 'too easy' | 'appropriate' | 'too hard'
): Exercise | null => {
  // This would need access to the full exercise database to find appropriate progressions
  // For now, return null as a placeholder
  return null;
};
