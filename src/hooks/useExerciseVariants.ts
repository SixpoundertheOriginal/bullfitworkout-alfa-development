import { useState } from 'react';
import { ExerciseVariant, ExerciseRecommendation, VariantSelectionData } from '@/types/exercise-variants';

// Mock data for demonstration until types are updated
const mockVariants: ExerciseVariant[] = [
  {
    id: '1',
    base_exercise_id: '1',
    user_id: '1',
    variant_name: 'Standard Pull-up',
    grip_type: 'overhand',
    grip_width: 'shoulder_width',
    technique_type: 'standard',
    range_of_motion: 'full',
    difficulty_modifier: 1.0,
    progression_order: 1,
    ai_recommended: true,
    description: 'Classic pull-up with overhand grip at shoulder width',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    base_exercise_id: '1',
    user_id: '1',
    variant_name: 'Wide-Grip Pull-up',
    grip_type: 'overhand',
    grip_width: 'wide',
    technique_type: 'standard',
    range_of_motion: 'full',
    difficulty_modifier: 1.2,
    progression_order: 2,
    ai_recommended: true,
    description: 'Pull-up with wide grip for increased lat activation',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    base_exercise_id: '1',
    user_id: '1',
    variant_name: 'Chin-up',
    grip_type: 'underhand',
    grip_width: 'shoulder_width',
    technique_type: 'standard',
    range_of_motion: 'full',
    difficulty_modifier: 0.9,
    progression_order: 1,
    ai_recommended: true,
    description: 'Underhand grip pull-up emphasizing bicep involvement',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockRecommendations: ExerciseRecommendation[] = [
  {
    id: '1',
    user_id: '1',
    exercise_id: '1',
    variant_id: '1',
    recommendation_type: 'progression',
    confidence_score: 0.85,
    reasoning: 'Based on your recent performance, this variant will help you progress',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const useExerciseVariants = (exerciseId?: string) => {
  const [selectedVariant, setSelectedVariant] = useState<VariantSelectionData | null>(null);

  // Filter mock variants for the specific exercise
  const variants = mockVariants.filter(v => v.base_exercise_id === exerciseId);
  const recommendations = mockRecommendations.filter(r => r.exercise_id === exerciseId);

  const selectVariant = (variantData: VariantSelectionData) => {
    setSelectedVariant(variantData);
  };

  const clearSelection = () => {
    setSelectedVariant(null);
  };

  const getProgressionTrend = (exerciseId: string) => {
    // Mock implementation - in real app, this would analyze workout history
    const trends = ['improving', 'stable', 'declining'];
    return trends[Math.floor(Math.random() * trends.length)] as 'improving' | 'stable' | 'declining';
  };

  const getLastPerformed = (exerciseId: string) => {
    // Mock implementation
    const daysAgo = Math.floor(Math.random() * 14) + 1;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
  };

  const getPersonalBest = (exerciseId: string) => {
    // Mock implementation
    return {
      weight: Math.floor(Math.random() * 100) + 50,
      reps: Math.floor(Math.random() * 15) + 5,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  };

  return {
    variants,
    recommendations,
    selectedVariant,
    selectVariant,
    clearSelection,
    getProgressionTrend,
    getLastPerformed,
    getPersonalBest,
    isLoading: false,
  };
};