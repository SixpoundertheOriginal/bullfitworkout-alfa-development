
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { PersonalRecordsService, PersonalRecord, PRDetectionResult } from "@/services/personalRecordsService";

export function usePersonalRecords() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const recentRecords = useQuery({
    queryKey: ['personal-records', user?.id],
    queryFn: () => PersonalRecordsService.getRecentRecords(user!.id),
    enabled: !!user
  });

  const detectPRs = useMutation({
    mutationFn: async ({
      exerciseName,
      weight,
      reps,
      workoutId
    }: {
      exerciseName: string;
      weight: number;
      reps: number;
      workoutId?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');
      return PersonalRecordsService.detectPersonalRecords(user.id, exerciseName, weight, reps, workoutId);
    }
  });

  const savePRs = useMutation({
    mutationFn: async ({
      exerciseName,
      prResults,
      workoutId,
      equipmentType
    }: {
      exerciseName: string;
      prResults: PRDetectionResult[];
      workoutId?: string;
      equipmentType?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');
      await PersonalRecordsService.savePersonalRecords(user.id, exerciseName, prResults, workoutId, equipmentType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-records'] });
      queryClient.invalidateQueries({ queryKey: ['exercise-performance'] });
    }
  });

  return {
    recentRecords: recentRecords.data || [],
    isLoading: recentRecords.isLoading,
    error: recentRecords.error,
    detectPRs,
    savePRs,
    refetch: recentRecords.refetch
  };
}

export function useExerciseRecords(exerciseName?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['exercise-records', user?.id, exerciseName],
    queryFn: () => PersonalRecordsService.getExerciseRecords(user!.id, exerciseName!),
    enabled: !!user && !!exerciseName
  });
}
