import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useWorkoutStats } from "./useWorkoutStats";
import { toast } from "@/hooks/use-toast";

interface QuickSetupTemplate {
  id: string;
  name: string;
  description: string | null;
  training_type: string;
  tags: string[];
  duration: number;
  suggested_exercises: string[];
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night' | null;
  usage_count: number;
  is_system_generated: boolean;
}

export function useQuickSetupTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { stats } = useWorkoutStats();
  
  const fetchTemplates = async () => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('quick_setup_templates')
      .select('*')
      .order('usage_count', { ascending: false });
      
    if (error) throw error;
    return data as QuickSetupTemplate[];
  };
  
  const generateDynamicTemplate = () => {
    const currentHour = new Date().getHours();
    const timeOfDay = 
      currentHour >= 5 && currentHour < 11 ? 'morning' :
      currentHour >= 11 && currentHour < 17 ? 'afternoon' :
      currentHour >= 17 && currentHour < 22 ? 'evening' : 'night';
    
    // Use workout stats to suggest a training type
    const recommendedType = stats.recommendedType || stats.workoutTypes[0]?.type || "Strength";
    const recommendedDuration = stats.recommendedDuration || 30;
    
    return {
      name: `${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Workout`,
      description: `Personalized ${timeOfDay} workout based on your history`,
      training_type: recommendedType,
      duration: recommendedDuration,
      tags: stats.recommendedTags || [],
      time_of_day: timeOfDay,
      suggested_exercises: [],
      is_system_generated: true
    };
  };

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['quick-setup-templates', user?.id],
    queryFn: fetchTemplates,
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<QuickSetupTemplate, 'id' | 'usage_count'>) => {
      if (!user) throw new Error("Must be logged in");
      
      const { data, error } = await supabase
        .from('quick_setup_templates')
        .insert({
          ...template,
          user_id: user.id
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-setup-templates'] });
      toast("Template created successfully");
    },
  });

  return {
    templates,
    isLoading,
    createTemplate,
    generateDynamicTemplate
  };
}
