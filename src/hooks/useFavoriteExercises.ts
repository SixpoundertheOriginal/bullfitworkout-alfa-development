import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Exercise } from '@/types/exercise';

export function useFavoriteExercises() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's favorite exercises
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorite-exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorite_exercises')
        .select('exercise_id');

      if (error) throw error;
      return data.map(fav => fav.exercise_id);
    }
  });

  // Add exercise to favorites
  const { mutate: addToFavorites } = useMutation({
    mutationFn: async (exerciseId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('favorite_exercises')
        .insert([{ 
          exercise_id: exerciseId,
          user_id: user.id 
        }]);

      if (error) throw error;
    },
    onSuccess: (_, exerciseId) => {
      queryClient.setQueryData(['favorite-exercises'], (old: string[] = []) => [
        ...old,
        exerciseId
      ]);
      toast({
        title: "Added to favorites",
        description: "Exercise has been added to your favorites",
      });
    },
    onError: (error) => {
      console.error('Error adding to favorites:', error);
      toast({
        title: "Error",
        description: "Failed to add exercise to favorites",
        variant: "destructive",
      });
    }
  });

  // Remove exercise from favorites
  const { mutate: removeFromFavorites } = useMutation({
    mutationFn: async (exerciseId: string) => {
      const { error } = await supabase
        .from('favorite_exercises')
        .delete()
        .eq('exercise_id', exerciseId);

      if (error) throw error;
    },
    onSuccess: (_, exerciseId) => {
      queryClient.setQueryData(['favorite-exercises'], (old: string[] = []) =>
        old.filter(id => id !== exerciseId)
      );
      toast({
        title: "Removed from favorites",
        description: "Exercise has been removed from your favorites",
      });
    },
    onError: (error) => {
      console.error('Error removing from favorites:', error);
      toast({
        title: "Error",
        description: "Failed to remove exercise from favorites",
        variant: "destructive",
      });
    }
  });

  // Toggle favorite status
  const toggleFavorite = (exercise: Exercise) => {
    if (favorites.includes(exercise.id)) {
      removeFromFavorites(exercise.id);
    } else {
      addToFavorites(exercise.id);
    }
  };

  // Check if exercise is favorite
  const isFavorite = (exerciseId: string) => {
    return favorites.includes(exerciseId);
  };

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
    addToFavorites,
    removeFromFavorites
  };
}