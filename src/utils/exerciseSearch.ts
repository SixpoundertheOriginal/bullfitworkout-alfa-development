import { Exercise } from "@/types/exercise";

export interface SearchResult {
  exercise: Exercise;
  score: number;
  matchReasons: string[];
}

export interface SearchOptions {
  includeEquipment?: boolean;
  includeMuscleGroups?: boolean;
  includeMovementPattern?: boolean;
  includeDifficulty?: boolean;
  fuzzyMatch?: boolean;
  maxResults?: number;
}

/**
 * Comprehensive exercise search utility that searches across all exercise fields
 * with relevance scoring and match explanations
 */
export function searchExercises(
  exercises: Exercise[],
  searchTerm: string,
  options: SearchOptions = {}
): SearchResult[] {
  if (!searchTerm.trim()) {
    return exercises.map(exercise => ({
      exercise,
      score: 1,
      matchReasons: []
    }));
  }

  const {
    includeEquipment = true,
    includeMuscleGroups = true,
    includeMovementPattern = true,
    includeDifficulty = true,
    fuzzyMatch = true,
    maxResults = 50
  } = options;

  const normalizedSearchTerm = searchTerm.toLowerCase().trim();
  const searchTerms = normalizedSearchTerm.split(/\s+/);
  
  const results: SearchResult[] = [];

  for (const exercise of exercises) {
    let score = 0;
    const matchReasons: string[] = [];

    // Search in exercise name (highest priority)
    if (exercise.name?.toLowerCase().includes(normalizedSearchTerm)) {
      score += 100;
      matchReasons.push("Name");
    }

    // Search individual terms in name for partial matches
    if (fuzzyMatch) {
      const nameWords = exercise.name?.toLowerCase().split(/\s+/) || [];
      for (const term of searchTerms) {
        for (const word of nameWords) {
          if (word.includes(term)) {
            score += 80;
            if (!matchReasons.includes("Name")) {
              matchReasons.push("Name");
            }
          }
        }
      }
    }

    // Search in description
    if (exercise.description?.toLowerCase().includes(normalizedSearchTerm)) {
      score += 60;
      matchReasons.push("Description");
    }

    // Search in equipment types
    if (includeEquipment && exercise.equipment_type) {
      const equipmentMatches = exercise.equipment_type.some(equipment => 
        equipment.toLowerCase().includes(normalizedSearchTerm) ||
        (fuzzyMatch && searchTerms.some(term => equipment.toLowerCase().includes(term)))
      );
      if (equipmentMatches) {
        score += 90;
        matchReasons.push("Equipment");
      }

      // Special handling for common abbreviations
      const equipmentAbbreviations: Record<string, string[]> = {
        'trx': ['suspension trainer', 'trx'],
        'db': ['dumbbell'],
        'bb': ['barbell'],
        'kb': ['kettlebell'],
        'bw': ['bodyweight'],
        'cable': ['cable machine'],
        'smith': ['smith machine']
      };

      for (const [abbrev, fullNames] of Object.entries(equipmentAbbreviations)) {
        if (normalizedSearchTerm.includes(abbrev)) {
          const hasMatchingEquipment = exercise.equipment_type.some(equipment =>
            fullNames.some(name => equipment.toLowerCase().includes(name))
          );
          if (hasMatchingEquipment) {
            score += 95;
            if (!matchReasons.includes("Equipment")) {
              matchReasons.push("Equipment");
            }
          }
        }
      }
    }

    // Search in primary muscle groups
    if (includeMuscleGroups && exercise.primary_muscle_groups) {
      const primaryMuscleMatches = exercise.primary_muscle_groups.some(muscle =>
        muscle.toLowerCase().includes(normalizedSearchTerm) ||
        (fuzzyMatch && searchTerms.some(term => muscle.toLowerCase().includes(term)))
      );
      if (primaryMuscleMatches) {
        score += 85;
        matchReasons.push("Primary muscles");
      }
    }

    // Search in secondary muscle groups
    if (includeMuscleGroups && exercise.secondary_muscle_groups) {
      const secondaryMuscleMatches = exercise.secondary_muscle_groups.some(muscle =>
        muscle.toLowerCase().includes(normalizedSearchTerm) ||
        (fuzzyMatch && searchTerms.some(term => muscle.toLowerCase().includes(term)))
      );
      if (secondaryMuscleMatches) {
        score += 70;
        matchReasons.push("Secondary muscles");
      }
    }

    // Search in movement pattern
    if (includeMovementPattern && exercise.movement_pattern) {
      if (exercise.movement_pattern.toLowerCase().includes(normalizedSearchTerm)) {
        score += 75;
        matchReasons.push("Movement pattern");
      }
    }

    // Search in difficulty
    if (includeDifficulty && exercise.difficulty) {
      if (exercise.difficulty.toLowerCase().includes(normalizedSearchTerm)) {
        score += 50;
        matchReasons.push("Difficulty");
      }
    }

    // Search in variations
    if (exercise.variations?.length) {
      const variationMatches = exercise.variations.some(variation =>
        variation.toLowerCase().includes(normalizedSearchTerm)
      );
      if (variationMatches) {
        score += 65;
        matchReasons.push("Variations");
      }
    }

    // Search in tips
    if (exercise.tips?.length) {
      const tipMatches = exercise.tips.some(tip =>
        tip.toLowerCase().includes(normalizedSearchTerm)
      );
      if (tipMatches) {
        score += 40;
        matchReasons.push("Tips");
      }
    }

    // Boost compound exercises
    if (exercise.is_compound && score > 0) {
      score += 10;
    }

    // Add to results if there's any match
    if (score > 0) {
      results.push({
        exercise,
        score,
        matchReasons
      });
    }
  }

  // Sort by score (highest first) and limit results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Simple filter function that returns only the exercises without scoring
 * Useful for components that don't need the search metadata
 */
export function filterExercises(
  exercises: Exercise[],
  searchTerm: string,
  options?: SearchOptions
): Exercise[] {
  return searchExercises(exercises, searchTerm, options).map(result => result.exercise);
}

/**
 * Get search suggestions based on common exercise attributes
 */
export function getSearchSuggestions(exercises: Exercise[]): string[] {
  const suggestions = new Set<string>();
  
  exercises.forEach(exercise => {
    // Add equipment types
    exercise.equipment_type?.forEach(equipment => {
      suggestions.add(equipment);
    });
    
    // Add muscle groups
    exercise.primary_muscle_groups?.forEach(muscle => {
      suggestions.add(muscle);
    });
    
    // Add movement patterns
    if (exercise.movement_pattern) {
      suggestions.add(exercise.movement_pattern);
    }
  });

  // Add common abbreviations
  const commonTerms = ['trx', 'db', 'bb', 'kb', 'bw', 'chest', 'back', 'legs', 'arms', 'core'];
  commonTerms.forEach(term => suggestions.add(term));

  return Array.from(suggestions).sort();
}