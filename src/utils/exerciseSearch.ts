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
 * Helper function to check if a word matches the search term with proper boundaries
 */
function getWordMatchScore(word: string, searchTerm: string): number {
  const cleanWord = word.trim().toLowerCase();
  const cleanSearchTerm = searchTerm.trim().toLowerCase();
  
  if (cleanWord === cleanSearchTerm) return 100; // Exact match
  if (cleanWord.startsWith(cleanSearchTerm)) return 90; // Starts with
  
  // Only allow partial matches for search terms with 3+ characters
  if (cleanSearchTerm.length >= 3 && cleanWord.includes(cleanSearchTerm)) {
    // Check if it's a word boundary match (not just substring)
    const words = cleanWord.split(/[\s-_]+/);
    const hasWordBoundaryMatch = words.some(w => 
      w.startsWith(cleanSearchTerm) || w === cleanSearchTerm
    );
    
    if (hasWordBoundaryMatch) return 70; // Word boundary match
    if (cleanWord.includes(cleanSearchTerm)) return 40; // Substring match (lower priority)
  }
  
  return 0; // No match or too short search term
}

/**
 * Helper function to score array field matches
 */
function scoreArrayFieldMatch(array: string[] | undefined, searchTerms: string[], fuzzyMatch: boolean): number {
  if (!array) return 0;
  
  let maxScore = 0;
  
  for (const item of array) {
    const itemLower = item.toLowerCase();
    
    for (const term of searchTerms) {
      // Check full phrase match first
      if (itemLower.includes(searchTerms.join(' '))) {
        maxScore = Math.max(maxScore, 100);
        continue;
      }
      
      // Check individual term matches
      if (fuzzyMatch) {
        const words = itemLower.split(/\s+/);
        for (const word of words) {
          const wordScore = getWordMatchScore(word, term);
          maxScore = Math.max(maxScore, wordScore);
        }
      } else {
        // Exact phrase matching only
        if (itemLower.includes(term)) {
          maxScore = Math.max(maxScore, 90);
        }
      }
    }
  }
  
  return maxScore;
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
    const exerciseName = exercise.name?.toLowerCase() || '';
    
    // Exact phrase match in name
    if (exerciseName.includes(normalizedSearchTerm)) {
      if (exerciseName === normalizedSearchTerm) {
        score += 150; // Perfect match
      } else if (exerciseName.startsWith(normalizedSearchTerm)) {
        score += 120; // Starts with
      } else {
        score += 100; // Contains
      }
      matchReasons.push("Name");
    }

    // Individual word matches in name (only if no exact phrase match)
    if (fuzzyMatch && score === 0) {
      const nameWords = exerciseName.split(/[\s-_]+/);
      let bestNameScore = 0;
      
      for (const term of searchTerms) {
        // Skip very short search terms to prevent false matches
        if (term.length < 2) continue;
        
        for (const word of nameWords) {
          const wordScore = getWordMatchScore(word, term);
          bestNameScore = Math.max(bestNameScore, wordScore);
        }
      }
      
      if (bestNameScore > 0) {
        score += bestNameScore;
        matchReasons.push("Name");
      }
    }

    // Search in aliases
    if (exercise.aliases && exercise.aliases.length > 0) {
      const aliasScore = scoreArrayFieldMatch(exercise.aliases, searchTerms, fuzzyMatch);
      if (aliasScore > 0) {
        score += aliasScore;
        matchReasons.push("Alias");
      }
    }

    // Search in description
    if (exercise.description?.toLowerCase().includes(normalizedSearchTerm)) {
      score += 60;
      matchReasons.push("Description");
    }

    // Search in equipment types
    if (includeEquipment && exercise.equipment_type) {
      const equipmentScore = scoreArrayFieldMatch(exercise.equipment_type, searchTerms, fuzzyMatch);
      if (equipmentScore > 0) {
        score += equipmentScore;
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
      const primaryMuscleScore = scoreArrayFieldMatch(exercise.primary_muscle_groups, searchTerms, fuzzyMatch);
      if (primaryMuscleScore > 0) {
        score += primaryMuscleScore;
        matchReasons.push("Primary muscles");
      }
    }

    // Search in secondary muscle groups
    if (includeMuscleGroups && exercise.secondary_muscle_groups) {
      const secondaryMuscleScore = scoreArrayFieldMatch(exercise.secondary_muscle_groups, searchTerms, fuzzyMatch);
      if (secondaryMuscleScore > 0) {
        score += Math.floor(secondaryMuscleScore * 0.8); // Slightly lower score for secondary muscles
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