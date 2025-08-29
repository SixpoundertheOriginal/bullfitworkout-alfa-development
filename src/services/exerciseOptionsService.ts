import { supabase } from '@/integrations/supabase/client';

export interface ExerciseOption {
  id: string;
  name: string;
}

const cache = new Map<string, ExerciseOption[]>();

export async function getExerciseOptions(userId: string): Promise<ExerciseOption[]> {
  if (cache.has(userId)) {
    return cache.get(userId)!;
  }

  const { data, error } = await supabase
    .from('exercise_sets')
    .select('exercise_id, exercise_name, workout_sessions!inner(user_id)')
    .eq('workout_sessions.user_id', userId);

  if (error) throw error;

  const ids = Array.from(
    new Set((data || []).map(row => row.exercise_id).filter(Boolean) as string[])
  );

  const idToName = new Map<string, string>();
  if (ids.length > 0) {
    const { data: exercises, error: exError } = await supabase
      .from('exercises')
      .select('id, name')
      .in('id', ids);
    if (exError) throw exError;
    for (const ex of exercises || []) {
      idToName.set(ex.id, ex.name);
    }
  }

  const nameSet = new Set<string>();
  const options: ExerciseOption[] = [];
  for (const row of data || []) {
    const resolvedName =
      (row.exercise_id && idToName.get(row.exercise_id)) ||
      row.exercise_name ||
      row.exercise_id;

    if (!resolvedName || nameSet.has(resolvedName)) continue;
    nameSet.add(resolvedName);

    options.push({
      id: row.exercise_id || resolvedName,
      name: resolvedName,
    });
  }

  options.sort((a, b) => a.name.localeCompare(b.name));
  cache.set(userId, options);
  return options;
}
