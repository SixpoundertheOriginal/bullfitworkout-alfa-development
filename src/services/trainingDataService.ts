import { supabase } from '@/integrations/supabase/client';
import { WorkoutSession, ExerciseSet } from '@/types/workout';

export interface TrainingDataSummary {
  totalWorkouts: number;
  totalVolume: number;
  totalSets: number;
  recentWorkouts: WorkoutSession[];
  topExercises: { name: string; volume: number; frequency: number }[];
  personalRecords: any[];
  recentTrends: {
    volumeChange: number;
    frequencyChange: number;
    strengthTrend: 'increasing' | 'decreasing' | 'stable';
  };
  muscleGroupBalance: Record<string, number>;
  averageMetrics: {
    duration: number;
    restTime: number;
    intensity: number;
  };
}

export class TrainingDataService {
  static async getUserTrainingData(userId: string): Promise<TrainingDataSummary> {
    console.log('Fetching comprehensive training data for user:', userId);
    
    // Fetch recent workouts (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const { data: workouts } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', threeMonthsAgo.toISOString())
      .order('start_time', { ascending: false });

    // Fetch exercise sets for recent workouts
    const workoutIds = workouts?.map(w => w.id) || [];
    const { data: exerciseSets } = await supabase
      .from('exercise_sets')
      .select('*')
      .in('workout_id', workoutIds);

    // Fetch personal records
    const { data: personalRecords } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(20);

    return this.processTrainingData(workouts || [], exerciseSets || [], personalRecords || []);
  }

  private static processTrainingData(
    workouts: WorkoutSession[],
    exerciseSets: ExerciseSet[],
    personalRecords: any[]
  ): TrainingDataSummary {
    const totalWorkouts = workouts.length;
    const totalSets = exerciseSets.filter(set => set.completed).length;
    const totalVolume = exerciseSets.reduce((sum, set) => 
      set.completed ? sum + (set.weight * set.reps) : sum, 0);

    // Calculate exercise statistics
    const exerciseStats = exerciseSets.reduce((acc, set) => {
      if (!set.completed) return acc;
      
      if (!acc[set.exercise_name]) {
        acc[set.exercise_name] = { volume: 0, frequency: 0 };
      }
      acc[set.exercise_name].volume += set.weight * set.reps;
      acc[set.exercise_name].frequency += 1;
      return acc;
    }, {} as Record<string, { volume: number; frequency: number }>);

    const topExercises = Object.entries(exerciseStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    // Calculate trends (last 4 weeks vs previous 4 weeks)
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const eightWeeksAgo = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);

    const recentWorkouts = workouts.filter(w => new Date(w.start_time) >= fourWeeksAgo);
    const previousWorkouts = workouts.filter(w => 
      new Date(w.start_time) >= eightWeeksAgo && new Date(w.start_time) < fourWeeksAgo);

    const recentVolume = this.calculatePeriodVolume(recentWorkouts, exerciseSets);
    const previousVolume = this.calculatePeriodVolume(previousWorkouts, exerciseSets);
    
    const volumeChange = previousVolume > 0 ? 
      ((recentVolume - previousVolume) / previousVolume) * 100 : 0;

    const frequencyChange = previousWorkouts.length > 0 ?
      ((recentWorkouts.length - previousWorkouts.length) / previousWorkouts.length) * 100 : 0;

    // Calculate muscle group distribution
    const muscleGroupBalance = this.calculateMuscleGroupBalance(exerciseSets);

    // Calculate average metrics
    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const totalRestTime = exerciseSets.reduce((sum, set) => sum + (set.rest_time || 0), 0);
    
    const averageMetrics = {
      duration: workouts.length > 0 ? totalDuration / workouts.length : 0,
      restTime: exerciseSets.length > 0 ? totalRestTime / exerciseSets.length : 0,
      intensity: this.calculateAverageIntensity(exerciseSets),
    };

    return {
      totalWorkouts,
      totalVolume,
      totalSets,
      recentWorkouts: workouts.slice(0, 10), // Last 10 workouts
      topExercises,
      personalRecords,
      recentTrends: {
        volumeChange,
        frequencyChange,
        strengthTrend: volumeChange > 5 ? 'increasing' : volumeChange < -5 ? 'decreasing' : 'stable',
      },
      muscleGroupBalance,
      averageMetrics,
    };
  }

  private static calculatePeriodVolume(workouts: WorkoutSession[], allSets: ExerciseSet[]): number {
    const workoutIds = workouts.map(w => w.id);
    return allSets
      .filter(set => workoutIds.includes(set.workout_id) && set.completed)
      .reduce((sum, set) => sum + (set.weight * set.reps), 0);
  }

  private static calculateMuscleGroupBalance(exerciseSets: ExerciseSet[]): Record<string, number> {
    // Simplified muscle group mapping - in real app, you'd have a proper exercise database
    const muscleGroupMap: Record<string, string[]> = {
      'Chest': ['bench press', 'push up', 'dips', 'chest', 'pec'],
      'Back': ['pull up', 'row', 'lat', 'back', 'deadlift'],
      'Legs': ['squat', 'lunge', 'leg', 'calf', 'glute'],
      'Shoulders': ['shoulder', 'press', 'raise', 'deltoid'],
      'Arms': ['curl', 'tricep', 'bicep', 'arm'],
    };

    const muscleGroupVolume = Object.keys(muscleGroupMap).reduce((acc, group) => {
      acc[group] = 0;
      return acc;
    }, {} as Record<string, number>);

    exerciseSets.forEach(set => {
      if (!set.completed) return;
      
      const exerciseName = set.exercise_name.toLowerCase();
      for (const [group, keywords] of Object.entries(muscleGroupMap)) {
        if (keywords.some(keyword => exerciseName.includes(keyword))) {
          muscleGroupVolume[group] += set.weight * set.reps;
          break;
        }
      }
    });

    return muscleGroupVolume;
  }

  private static calculateAverageIntensity(exerciseSets: ExerciseSet[]): number {
    const completedSets = exerciseSets.filter(set => set.completed);
    if (completedSets.length === 0) return 0;

    // Simple intensity calculation based on weight progression
    const avgWeight = completedSets.reduce((sum, set) => sum + set.weight, 0) / completedSets.length;
    return Math.min(avgWeight / 10, 10); // Normalize to 0-10 scale
  }

  static formatDataForAI(data: TrainingDataSummary): string {
    return `
TRAINING DATA SUMMARY:
- Total Workouts: ${data.totalWorkouts}
- Total Volume: ${data.totalVolume.toFixed(1)}kg
- Total Sets: ${data.totalSets}
- Recent Trend: ${data.recentTrends.strengthTrend} (${data.recentTrends.volumeChange.toFixed(1)}% volume change)

TOP EXERCISES:
${data.topExercises.slice(0, 5).map(ex => 
  `- ${ex.name}: ${ex.volume.toFixed(1)}kg total volume`
).join('\n')}

RECENT PERSONAL RECORDS:
${data.personalRecords.slice(0, 3).map(pr => 
  `- ${pr.exercise_name}: ${pr.value}${pr.unit} (${new Date(pr.date).toLocaleDateString()})`
).join('\n')}

MUSCLE GROUP BALANCE:
${Object.entries(data.muscleGroupBalance).map(([group, volume]) => 
  `- ${group}: ${volume.toFixed(1)}kg`
).join('\n')}

AVERAGE METRICS:
- Workout Duration: ${Math.round(data.averageMetrics.duration)} minutes
- Rest Time: ${Math.round(data.averageMetrics.restTime)} seconds
- Training Intensity: ${data.averageMetrics.intensity.toFixed(1)}/10
    `;
  }
}