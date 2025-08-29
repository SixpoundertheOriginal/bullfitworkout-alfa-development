import { supabase } from "@/integrations/supabase/client";

export interface ExerciseFeedbackInput {
  workoutId: string;
  exerciseId: string;
  perceivedDifficulty: number;
  satisfaction: number;
}

export async function logExerciseFeedback(input: ExerciseFeedbackInput) {
  const { error } = await (supabase as any)
    .from('exercise_feedback')
    .insert({
      workout_id: input.workoutId,
      exercise_id: input.exerciseId,
      perceived_difficulty: input.perceivedDifficulty,
      satisfaction: input.satisfaction,
    });
  if (error) throw error;
}
