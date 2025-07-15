
import { Exercise, MuscleGroup, MovementPattern } from "@/types/exercise";

export interface RankingCriteria {
  trainingType?: string;
  bodyFocus?: MuscleGroup[];
  movementPattern?: MovementPattern[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  equipment?: string[];
  duration?: number; // in minutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface ScoredExercise {
  exercise: Exercise;
  score: number;
  matchReasons: string[];
}

/**
 * Ranks exercises based on user preferences and returns a sorted list
 * @param exercises List of available exercises
 * @param criteria User preference criteria
 * @returns Sorted list of exercises with ranking scores and match reasons
 */
export function rankExercises(
  exercises: Exercise[],
  criteria: RankingCriteria
): {
  recommended: Exercise[];
  other: Exercise[];
  matchData: Record<string, { score: number; reasons: string[] }>;
} {
  if (!exercises || exercises.length === 0) {
    return { recommended: [], other: [], matchData: {} };
  }

  const scoredExercises: ScoredExercise[] = exercises.map(exercise => {
    let score = 0;
    const matchReasons: string[] = [];

    // Training type match (highest priority)
    if (criteria.trainingType) {
      const trainingType = criteria.trainingType.toLowerCase();
      
      // Match based on training type
      if (
        (trainingType === 'strength' && (
          exercise.is_compound ||
          exercise.equipment_type.some(t => ['barbell', 'dumbbell', 'machine'].includes(t))
        )) ||
        (trainingType === 'cardio' && (
          exercise.equipment_type.some(t => ['bodyweight', 'cardio machine'].includes(t))
        )) ||
        (trainingType === 'yoga' && (
          exercise.equipment_type.includes('bodyweight') ||
          exercise.movement_pattern === 'isometric'
        )) ||
        (trainingType === 'calisthenics' && exercise.equipment_type.includes('bodyweight'))
      ) {
        score += 30;
        matchReasons.push(`Good for ${criteria.trainingType} training`);
      }
    }

    // Body focus match
    if (criteria.bodyFocus && criteria.bodyFocus.length > 0) {
      const primaryMatches = criteria.bodyFocus.filter(focus => 
        exercise.primary_muscle_groups.includes(focus)
      );
      
      const secondaryMatches = criteria.bodyFocus.filter(focus => 
        exercise.secondary_muscle_groups.includes(focus)
      );
      
      if (primaryMatches.length > 0) {
        score += 25 * primaryMatches.length;
        matchReasons.push(`Targets ${primaryMatches.join(', ')}`);
      }
      
      if (secondaryMatches.length > 0) {
        score += 10 * secondaryMatches.length;
        matchReasons.push(`Also works ${secondaryMatches.join(', ')}`);
      }
    }

    // Movement pattern match
    if (criteria.movementPattern && criteria.movementPattern.length > 0) {
      if (criteria.movementPattern.includes(exercise.movement_pattern)) {
        score += 20;
        matchReasons.push(`Uses ${exercise.movement_pattern} pattern`);
      }
    }

    // Equipment availability match
    if (criteria.equipment && criteria.equipment.length > 0) {
      const equipmentMatches = criteria.equipment.filter(eq => 
        exercise.equipment_type.includes(eq as any)
      );
      
      if (equipmentMatches.length > 0) {
        score += 15;
        matchReasons.push(`Uses available equipment`);
      }
    }

    // Difficulty match
    if (criteria.difficulty) {
      if (exercise.difficulty === criteria.difficulty) {
        score += 15;
        matchReasons.push(`Matches your experience level`);
      } else if (
        (criteria.difficulty === 'beginner' && exercise.difficulty === 'intermediate') ||
        (criteria.difficulty === 'intermediate' && 
          (exercise.difficulty === 'beginner' || exercise.difficulty === 'advanced')) ||
        (criteria.difficulty === 'advanced' && 
          (exercise.difficulty === 'intermediate' || exercise.difficulty === 'expert')) ||
        (criteria.difficulty === 'expert' && exercise.difficulty === 'advanced')
      ) {
        // Close match in difficulty
        score += 5;
        matchReasons.push(`Similar to your experience level`);
      }
    }

    // Time of day appropriateness (from metadata if available)
    if (criteria.timeOfDay && exercise.metadata) {
      const timeScores = exercise.metadata.time_of_day_scores as Record<string, number> | undefined;
      if (timeScores && timeScores[criteria.timeOfDay]) {
        const timeScore = timeScores[criteria.timeOfDay];
        score += timeScore * 10; // Scale from 0-10
        if (timeScore > 0.7) {
          matchReasons.push(`Great for ${criteria.timeOfDay} workouts`);
        }
      }
    }

    // Compound exercises get a slight bonus as they're generally more efficient
    if (exercise.is_compound) {
      score += 10;
      matchReasons.push('Compound movement (efficient)');
    }

    return { exercise, score, matchReasons };
  });

  // Sort exercises by score
  scoredExercises.sort((a, b) => b.score - a.score);

  // Split into recommended (score > 40) and other exercises
  const recommended = scoredExercises
    .filter(scored => scored.score >= 40)
    .map(scored => scored.exercise);
    
  const other = scoredExercises
    .filter(scored => scored.score < 40)
    .map(scored => scored.exercise);

  // Create match data for UI presentation
  const matchData: Record<string, { score: number; reasons: string[] }> = {};
  scoredExercises.forEach(scored => {
    matchData[scored.exercise.id] = {
      score: scored.score,
      reasons: scored.matchReasons
    };
  });

  return { 
    recommended, 
    other,
    matchData
  };
}

/**
 * Gets the current time of day category
 */
export function getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Estimate if an exercise is appropriate for the given time of day
 * This would generally be stored in the exercise metadata, but
 * this function provides fallback logic
 */
export function estimateTimeOfDayScore(
  exercise: Exercise, 
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
): number {
  // Default logic when metadata doesn't have time scores
  
  // Morning: Better for cardio, full body, lighter weights
  if (timeOfDay === 'morning') {
    if (
      exercise.primary_muscle_groups.includes('cardio') ||
      exercise.primary_muscle_groups.includes('full body') ||
      exercise.equipment_type.includes('bodyweight')
    ) {
      return 0.9;
    }
    return 0.6;
  }
  
  // Afternoon: Good for most exercises, peak performance time
  if (timeOfDay === 'afternoon') {
    return 0.8; // Good time for most exercises
  }
  
  // Evening: Good for strength, not ideal for high intensity before bed
  if (timeOfDay === 'evening') {
    if (
      exercise.is_compound && 
      (exercise.equipment_type.includes('barbell') || 
       exercise.equipment_type.includes('dumbbell'))
    ) {
      return 0.85;
    }
    return 0.7;
  }
  
  // Night: Better for stretching, yoga, light movements
  if (timeOfDay === 'night') {
    if (
      exercise.movement_pattern === 'isometric' ||
      exercise.equipment_type.includes('bodyweight') ||
      exercise.difficulty === 'beginner'
    ) {
      return 0.7;
    }
    return 0.4; // Not recommended for intense exercise at night
  }
  
  return 0.6; // Default score
}
