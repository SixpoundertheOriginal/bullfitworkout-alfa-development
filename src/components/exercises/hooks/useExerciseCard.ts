import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useWeightUnit } from "@/context/WeightUnitContext";
import { convertWeight } from "@/utils/unitConversion";
import { ExerciseSet } from "@/types/workout-enhanced";

interface PreviousSessionData {
  weight: number;
  reps: number;
  sets: number;
}

export type PreviousSession = PreviousSessionData | null;

export const useExerciseCard = (exerciseName: string, sets: ExerciseSet[]) => {
  const { user } = useAuth();
  const { weightUnit } = useWeightUnit();

  const {
    data: previousSession,
    isLoading: loadingPreviousSession,
  } = useQuery<PreviousSession>({
    queryKey: ["previous-session", user?.id, exerciseName, weightUnit],
    enabled: !!user && !!exerciseName,
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("exercise_sets")
        .select(
          "weight, reps, workout_id, set_number, workout_sessions!inner(start_time, user_id)"
        )
        .eq("exercise_name", exerciseName)
        .eq("workout_sessions.user_id", user.id)
        .order("workout_sessions.start_time", {
          foreignTable: "workout_sessions",
          ascending: false,
        })
        .order("set_number", { ascending: true })
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const latestSet = data[0];

      const { count, error: countError } = await supabase
        .from("exercise_sets")
        .select("id", { count: "exact", head: true })
        .eq("exercise_name", exerciseName)
        .eq("workout_id", latestSet.workout_id);

      if (countError) throw countError;

      return {
        weight: convertWeight(latestSet.weight, "kg", weightUnit),
        reps: latestSet.reps,
        sets: count ?? 1,
      };
    },
  });

  const currentVolume = useMemo(() => {
    return sets.reduce((total, set) => {
      if (set.completed && set.weight > 0 && set.reps > 0) {
        return total + set.weight * set.reps;
      }
      return total;
    }, 0);
  }, [sets]);

  const previousVolume = useMemo(() => {
    if (!previousSession) return 0;
    return previousSession.weight * previousSession.reps * previousSession.sets;
  }, [previousSession]);

  const volumeMetrics = useMemo(() => {
    const volumeDiff =
      currentVolume > 0 && previousVolume > 0
        ? currentVolume - previousVolume
        : 0;
    const volumePercentChange =
      previousVolume > 0
        ? ((volumeDiff / previousVolume) * 100).toFixed(1)
        : "0";
    const hasValidComparison = previousSession !== null && previousVolume > 0;

    return {
      volumeDiff,
      volumePercentChange,
      hasValidComparison,
    };
  }, [currentVolume, previousVolume, previousSession]);

  return {
    previousSession,
    currentVolume,
    previousVolume,
    volumeMetrics,
    loadingPreviousSession,
  };
};

