import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/context/AuthContext'

export interface ExerciseOption {
  id: string
  name: string
}

export function useExerciseOptions() {
  const { user } = useAuth()

  return useQuery<ExerciseOption[]>({
    queryKey: ['exercise-options', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('exercise_sets')
        .select('exercise_id, exercises(name), workout_sessions!inner(user_id)')
        .eq('workout_sessions.user_id', user.id)

      if (error) throw error

      const map = new Map<string, string>()
      for (const row of data || []) {
        if (row.exercise_id) {
          const name = (row as any).exercises?.name || row.exercise_id
          map.set(row.exercise_id, name)
        }
      }
      return Array.from(map.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name))
    },
  })
}

