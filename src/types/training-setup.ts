export interface TrainingFocus {
  category: 'Push' | 'Pull' | 'Legs' | 'Full Body' | 'Arms' | 'Core' | 'Deload / Rehab';
  description: string;
  subFocus?: string[];
  primaryMuscles: string[];
  recommendedExercises: string[];
}

export interface TrainingGoals {
  targetTonnage: number;
  tonnageLevel: 'Light' | 'Moderate' | 'Heavy' | 'Custom';
  timeBudget: number;
  structure: 'Straight Sets' | 'Supersets' | 'Circuit';
  repRange: 'Strength (3-6)' | 'Hypertrophy (8-12)' | 'Endurance (12-20)';
  restStyle: 'Strict' | 'Adaptive' | 'Minimal';
  includeIsometrics: boolean;
  includeUnilateral: boolean;
  includeCore: boolean;
}

export interface EnhancedTrainingConfig {
  trainingFocus: TrainingFocus;
  goals: TrainingGoals;
  estimatedCalories: number;
  estimatedXP: number;
  smartSuggestions: string[];
  rankedExercises?: {
    recommended: any[];
    other: any[];
    matchData: Record<string, { score: number, reasons: string[] }>;
  };
}

export const TRAINING_FOCUSES: TrainingFocus[] = [
  {
    category: 'Push',
    description: 'Chest, shoulders, triceps',
    subFocus: ['Chest-heavy', 'Shoulder-focus', 'Overhead strength'],
    primaryMuscles: ['chest', 'shoulders', 'triceps'],
    recommendedExercises: ['Weighted Dips', 'Incline Bench Press', 'Push-ups', 'Overhead Press']
  },
  {
    category: 'Pull',
    description: 'Back, biceps',
    subFocus: ['Weighted pull-ups', 'Volume pull', 'Row-dominant'],
    primaryMuscles: ['back', 'biceps'],
    recommendedExercises: ['Weighted Pull-ups', 'Rows', 'Cable Pulls', 'Chin-ups']
  },
  {
    category: 'Legs',
    description: 'Quads, hamstrings, glutes, calves',
    subFocus: ['Squat-dominant', 'Deadlift-focused', 'Accessories'],
    primaryMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
    recommendedExercises: ['Squats', 'Deadlifts', 'Leg Extensions', 'Calf Raises']
  },
  {
    category: 'Full Body',
    description: 'Blended compound movements',
    subFocus: ['Superset', 'Compound-only', 'Metcon-style'],
    primaryMuscles: ['full body'],
    recommendedExercises: ['Burpees', 'Thrusters', 'Clean & Press', 'Mountain Climbers']
  },
  {
    category: 'Arms',
    description: 'Isolation work (biceps, triceps)',
    subFocus: ['Supersets', 'Volume', 'High-rep burn'],
    primaryMuscles: ['biceps', 'triceps'],
    recommendedExercises: ['EZ Curls', 'Hammer Curls', 'Tricep Rope', 'Close-grip Press']
  },
  {
    category: 'Core',
    description: 'Ab-specific or core stability',
    subFocus: ['Weighted', 'Volume', 'Static holds'],
    primaryMuscles: ['core', 'abs'],
    recommendedExercises: ['Weighted Leg Raises', 'Cable Crunches', 'Planks', 'Ab Wheel']
  },
  {
    category: 'Deload / Rehab',
    description: 'Light tempo-controlled sessions',
    subFocus: ['Stretch-focused', 'Mobility', 'Recovery work'],
    primaryMuscles: ['flexibility', 'mobility'],
    recommendedExercises: ['Light Stretching', 'Foam Rolling', 'Band Work', 'Yoga Flow']
  }
];

export const TONNAGE_PRESETS = {
  'Light': { min: 1000, max: 3000, color: 'text-green-400' },
  'Moderate': { min: 3000, max: 5000, color: 'text-blue-400' },
  'Heavy': { min: 5000, max: 8000, color: 'text-purple-400' },
  'Custom': { min: 500, max: 15000, color: 'text-orange-400' }
};

export const TIME_PRESETS = [20, 30, 45, 60, 90, 120];

export const calculateSmartDefaults = (focus: TrainingFocus, userHistory?: any) => {
  const defaults = {
    'Push': { tonnage: 5500, duration: 50, avgSets: 16 },
    'Pull': { tonnage: 6000, duration: 55, avgSets: 18 },
    'Legs': { tonnage: 4500, duration: 40, avgSets: 14 },
    'Full Body': { tonnage: 3500, duration: 35, avgSets: 12 },
    'Arms': { tonnage: 2000, duration: 30, avgSets: 10 },
    'Core': { tonnage: 1000, duration: 25, avgSets: 8 },
    'Deload / Rehab': { tonnage: 800, duration: 20, avgSets: 6 }
  };

  return defaults[focus.category] || defaults['Full Body'];
};