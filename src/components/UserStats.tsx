import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { 
  Dumbbell, 
  Calendar, 
  Timer, 
  TrendingUp,
  Award,
  Target,
  Flame
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkoutTypeChart } from "@/components/metrics/WorkoutTypeChart";
import { WorkoutSummary } from "@/components/workouts/WorkoutSummary";
import { StatCard } from "@/components/metrics/StatCard";
import StatsLoadingSkeleton from "@/components/metrics/StatsLoadingSkeleton";

// Define an interface for the workout data structure from Supabase
interface WorkoutSession {
  id: string;
  user_id: string;
  name: string;
  training_type: string;
  start_time: string;
  end_time: string;
  duration: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  tags?: string[]; // Added tags as optional property
}

export interface WorkoutTypeStats {
  type: string;
  count: number;
  totalDuration: number;
  percentage: number;
  // Add time of day distribution
  timeOfDay: {
    morning: number;   // 5am-11am
    afternoon: number; // 11am-5pm
    evening: number;   // 5pm-10pm
    night: number;     // 10pm-5am
  };
  // Add average duration
  averageDuration: number;
}

export interface TopExerciseStats {
  exerciseName: string;
  count: number;
  totalSets: number;
  averageWeight: number;
  totalVolume: number;
  // Add preferred tags association
  associatedTags: string[];
  // Add trend and percentChange properties
  trend?: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  percentChange?: number;
}

export interface TagStats {
  name: string;
  count: number;
  category: 'strength' | 'cardio' | 'recovery' | 'flexibility' | 'other';
  associatedTypes: string[];
  timeOfDay: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
}

export interface TimePatternStats {
  preferredDuration: number;
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  durationByTimeOfDay: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  // Day of week patterns
  daysFrequency: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
}

// Add new interface for exercise volume tracking
export interface ExerciseVolumeHistory {
  exercise_name: string;
  workouts: {
    date: string;
    volume: number;
    sets: number;
    avgWeight: number;
  }[];
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  percentChange: number;
}

// Add muscle group tracking to workout stats
export interface MuscleGroupDistribution {
  group: string;
  volume: number;
  frequency: number;
  percentage: number;
}

// Updated ProgressMetrics interface with correct types
export interface ProgressMetrics {
  volumeChange: number;
  volumeChangePercentage: number;
  strengthTrend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  frequencyChange: number;
  consistencyScore: number;
}

// Extend WorkoutStats to include advanced metrics
export interface WorkoutStats {
  totalWorkouts: number;
  totalDuration: number;
  avgDuration: number;
  totalExercises: number;
  totalSets: number;
  topExercises: TopExerciseStats[];
  workoutTypes: WorkoutTypeStats[];
  lastWorkoutDate: string | null;
  streakDays: number;
  // New analytics
  tags: TagStats[];
  timePatterns: TimePatternStats;
  // Personalized recommendations
  recommendedType: string | null;
  recommendedDuration: number | null;
  recommendedTags: string[];
  
  // Advanced analytics
  exerciseVolumeHistory: ExerciseVolumeHistory[];
  muscleGroups: MuscleGroupDistribution[];
  progressMetrics: ProgressMetrics;
}

const UserStatsComponent = () => {
  const { user } = useAuth();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async (): Promise<any> => {
      if (!user) throw new Error("User not authenticated");
      
      // Fetch workout sessions
      const { data: workoutSessions, error } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      // Group by training type
      const typeCount: Record<string, number> = {};
      workoutSessions?.forEach(session => {
        typeCount[session.training_type] = (typeCount[session.training_type] || 0) + 1;
      });
      
      const workoutsByType = Object.entries(typeCount).map(([name, value]) => ({
        name,
        value
      }));
      
      // Get total sets
      const { data: totalSetsData, error: setsError } = await supabase
        .from("exercise_sets")
        .select("id")
        .in("workout_id", workoutSessions?.map(w => w.id) || []);
        
      if (setsError) throw setsError;
      
      // Calculate stats
      const totalWorkouts = workoutSessions?.length || 0;
      const totalDuration = workoutSessions?.reduce((sum, w) => sum + (w.duration || 0), 0) || 0;
      const averageDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
      
      return {
        totalWorkouts,
        totalDuration,
        averageDuration,
        workoutsByType,
        recentWorkouts: workoutSessions?.slice(0, 5) || [],
        totalSets: totalSetsData?.length || 0
      };
    },
    enabled: !!user
  });
  
  // Format time (seconds) to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <StatsLoadingSkeleton />;
  }

  const emptyStats = !stats || stats.totalWorkouts === 0;

  // Prepare data for WorkoutTypeChart
  const workoutTypeData = stats?.workoutTypes?.map(type => ({
    type: type.type,
    count: type.count,
    totalDuration: type.totalDuration,
    percentage: type.percentage,
    timeOfDay: type.timeOfDay,
    averageDuration: type.averageDuration
  })) || [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Your Fitness Stats</h2>
      
      {emptyStats ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 text-center">
            <Dumbbell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Workout Data Yet</h3>
            <p className="text-gray-400">
              Complete your first workout to see your fitness statistics here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              icon={<Calendar className="h-5 w-5 text-purple-400" />}
              label="Total Workouts"
              value={stats.totalWorkouts.toString()}
            />
            <StatCard 
              icon={<Dumbbell className="h-5 w-5 text-purple-400" />}
              label="Total Sets"
              value={stats.totalSets.toString()}
            />
            <StatCard 
              icon={<Timer className="h-5 w-5 text-purple-400" />}
              label="Avg. Duration"
              value={formatTime(stats.averageDuration)}
            />
            <StatCard 
              icon={<Flame className="h-5 w-5 text-purple-400" />}
              label="Total Time"
              value={`${Math.floor(stats.totalDuration / 60)} min`}
            />
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Workout types distribution - Fixed: passing workoutTypes instead of data */}
            <WorkoutTypeChart workoutTypes={workoutTypeData} />
            
            {/* Recent workouts */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-4">Recent Workouts</h3>
                <div className="space-y-3">
                  {stats.recentWorkouts.map((workout) => (
                    <div key={workout.id} className="flex items-center justify-between p-2 rounded bg-gray-800">
                      <div>
                        <div className="font-medium text-white">{workout.name}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(workout.start_time).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300">
                          {formatTime(workout.duration)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

// Export the component correctly
export const UserStats = React.memo(UserStatsComponent);
