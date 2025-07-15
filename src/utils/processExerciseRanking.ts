
import { Exercise, MuscleGroup, MovementPattern } from "@/types/exercise";
import { RankingCriteria, rankExercises } from "@/utils/exerciseRankingUtils";

/**
 * Processes and ranks available exercises given user-selected criteria.
 * @param exercises - The list of all available exercises.
 * @param criteria - The user's selected training/filter settings.
 * @returns The sorted/ranked exercises with extra metadata for UI.
 */
export function processExerciseRanking(
  exercises: Exercise[],
  criteria: RankingCriteria
): { recommended: Exercise[]; other: Exercise[]; matchData: Record<string, { score: number, reasons: string[] }> } {
  return rankExercises(exercises, criteria);
}
