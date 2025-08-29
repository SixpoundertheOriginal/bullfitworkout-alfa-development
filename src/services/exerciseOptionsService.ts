import { supabase } from '@/integrations/supabase/client';

export interface ExerciseOption {
  id: string;
  name: string;
}

export async function getExerciseOptions(userId: string): Promise<ExerciseOption[]> {
  const { data, error } = await supabase
    .from('exercise_sets')
    .select('exercise_id, exercise_name, exercises(name), workout_sessions!inner(user_id)')
    .eq('workout_sessions.user_id', userId)
    .not('exercise_id', 'is', null);

  if (error) throw error;

  const map = new Map<string, string>();
  for (const row of data || []) {
    if (row.exercise_id) {
      const name =
        (row as any).exercises?.name ??
        (row as any).exercise_name ??
        row.exercise_id;
      map.set(row.exercise_id, name);
    }
  }

  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
