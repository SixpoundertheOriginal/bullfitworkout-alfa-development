import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { getExerciseOptions, ExerciseOption } from '@/services/exerciseOptionsService'

export function useExerciseOptions() {
  const { user } = useAuth()

  return useQuery<ExerciseOption[]>({
    queryKey: ['exercise-options', user?.id],
    enabled: !!user?.id,
    queryFn: () => (user?.id ? getExerciseOptions(user.id) : Promise.resolve([])),
  })
}

