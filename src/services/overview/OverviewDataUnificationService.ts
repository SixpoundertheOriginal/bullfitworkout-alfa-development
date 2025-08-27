// Single service for Overview data consistency - wraps existing logic without rebuilding
import { supabase } from '@/integrations/supabase/client';
import { processWorkoutMetrics } from '@/utils/workoutMetricsProcessor';
import { PersonalRecordsService } from '@/services/personalRecordsService';
import { UnifiedOverviewData, DateRange, ServiceError } from './overviewTypes';
import { WorkoutStats } from '@/types/workout-metrics';
import { startOfWeek, endOfWeek } from 'date-fns';

export class OverviewDataUnificationService {
  /**
   * Get unified overview data - single source of truth for all Overview components
   */
  static async getUnifiedOverviewData(
    dateRange: DateRange | undefined,
    userId: string,
    weightUnit: 'kg' | 'lb' = 'kg'
  ): Promise<UnifiedOverviewData> {
    try {
      console.log('🔄 Fetching unified overview data...');
      
      // Use existing date range logic from useOptimizedWorkoutStats
      const queryDates = this.calculateQueryDates(dateRange);
      
      // Fetch workout data using existing pattern
      const workouts = await this.fetchWorkoutData(userId, queryDates);
      
      // Process stats using existing logic from useOptimizedWorkoutStats
      const stats = this.processWorkoutStats(workouts);
      
      // Calculate metrics using existing workoutMetricsProcessor
      const processedMetrics = this.calculateProcessedMetrics(workouts, weightUnit);
      
      // Extract unified chart data
      const chartData = this.extractChartData(stats, processedMetrics);
      
      // Generate time series data for consistency
      const { volumeOverTimeData, densityOverTimeData } = this.generateTimeSeriesData(workouts, weightUnit);
      
      // Calculate derived flags for data availability
      const dataFlags = this.calculateDataFlags(workouts, processedMetrics);
      
      console.log('✅ Unified overview data ready');
      
      return {
        stats,
        workouts,
        processedMetrics,
        volumeOverTimeData,
        densityOverTimeData,
        chartData,
        ...dataFlags,
        densityStats: processedMetrics?.densityMetrics || null
      };
      
    } catch (error) {
      console.error('❌ Error in OverviewDataUnificationService:', error);
      throw new ServiceError('Failed to fetch unified overview data', error as Error);
    }
  }

  /**
   * Calculate query dates using existing useOptimizedWorkoutStats logic
   */
  private static calculateQueryDates(dateRange: DateRange | undefined) {
    const now = new Date();
    
    // Default to current week if no date range provided
    const defaultFrom = dateRange?.from || startOfWeek(now, { weekStartsOn: 1 });
    const defaultTo = dateRange?.to || endOfWeek(now, { weekStartsOn: 1 });
    
    const adjustedTo = new Date(defaultTo);
    adjustedTo.setDate(adjustedTo.getDate() + 1);
    
    return {
      from: defaultFrom.toISOString(),
      to: adjustedTo.toISOString()
    };
  }

  /**
   * Fetch workout data using existing pattern from useOptimizedWorkoutStats
   */
  private static async fetchWorkoutData(userId: string, queryDates: { from: string; to: string }) {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*, duration, exercises:exercise_sets(*)')
      .eq('user_id', userId)
      .gte('start_time', queryDates.from)
      .lt('start_time', queryDates.to)
      .order('start_time', { ascending: false });

    if (error) {
      throw new ServiceError('Failed to fetch workout data', error);
    }

    return data || [];
  }

  /**
   * Process workout stats using existing logic from useOptimizedWorkoutStats
   */
  private static processWorkoutStats(sessions: any[]): WorkoutStats {
    if (!sessions.length) {
      return {
        totalWorkouts: 0,
        totalExercises: 0,
        totalSets: 0,
        totalDuration: 0,
        avgDuration: 0,
        workoutTypes: [],
        tags: [],
        progressMetrics: { volumeChangePercentage: 0, strengthTrend: 'stable', consistencyScore: 0 },
        streakDays: 0,
        workouts: [],
        timePatterns: {
          daysFrequency: { monday:0, tuesday:0, wednesday:0, thursday:0, friday:0, saturday:0, sunday:0 },
          durationByTimeOfDay: { morning:0, afternoon:0, evening:0, night:0 }
        },
        muscleFocus: {},
        exerciseVolumeHistory: [],
      };
    }

    const totalWorkouts = sessions.length;
    const totalDuration = sessions.reduce((sum, w) => sum + (w.duration || 0), 0);
    const avgDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;

    // Use existing optimization pattern from useOptimizedWorkoutStats
    const counters = sessions.reduce((acc, workout) => {
      // Training type counting
      const type = workout.training_type || 'Unknown';
      acc.typeCounts[type] = (acc.typeCounts[type] || 0) + 1;

      // Day frequency
      const dayKey = new Date(workout.start_time)
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase() as keyof typeof acc.daysFrequency;
      if (acc.daysFrequency[dayKey] !== undefined) {
        acc.daysFrequency[dayKey] = (acc.daysFrequency[dayKey] || 0) + 1;
      }

      // Time of day distribution
      const hr = new Date(workout.start_time).getHours();
      const duration = workout.duration || 0;
      if (hr < 12) acc.durationByTimeOfDay.morning += duration;
      else if (hr < 17) acc.durationByTimeOfDay.afternoon += duration;
      else if (hr < 21) acc.durationByTimeOfDay.evening += duration;
      else acc.durationByTimeOfDay.night += duration;

      // Exercise processing - calculate muscle focus and volume
      if (Array.isArray(workout.exercises)) {
        const uniqueExercises = Array.from(new Set(workout.exercises.map((e: any) => e.exercise_name)));
        acc.exerciseCount += uniqueExercises.length;
        acc.setCount += workout.exercises.length;

        workout.exercises.forEach((set: any) => {
          if (set.weight && set.reps && set.completed) {
            const volume = set.weight * set.reps;
            
            // Track exercise stats
            if (!acc.exerciseStats[set.exercise_name]) {
              acc.exerciseStats[set.exercise_name] = { totalVolume: 0, totalSets: 0 };
            }
            acc.exerciseStats[set.exercise_name].totalVolume += volume;
            acc.exerciseStats[set.exercise_name].totalSets += 1;
            
            // Calculate muscle focus
            const muscleGroup = this.getExerciseMainMuscleGroup(set.exercise_name);
            if (muscleGroup) {
              acc.muscleFocus[muscleGroup] = (acc.muscleFocus[muscleGroup] || 0) + 1;
            }
          }
        });
      }

      return acc;
    }, {
      typeCounts: {} as Record<string, number>,
      daysFrequency: { monday:0, tuesday:0, wednesday:0, thursday:0, friday:0, saturday:0, sunday:0 },
      durationByTimeOfDay: { morning:0, afternoon:0, evening:0, night:0 },
      exerciseCount: 0,
      setCount: 0,
      exerciseStats: {} as Record<string, { totalVolume: number; totalSets: number }>,
      muscleFocus: {} as Record<string, number>
    });

    // Build final data structures
    const workoutTypes = Object.entries(counters.typeCounts)
      .map(([type, count]: [string, number]) => ({ 
        type, 
        count, 
        percentage: (count / totalWorkouts) * 100 
      }))
      .sort((a, b) => b.count - a.count);

    const exerciseVolumeHistory = Object.entries(counters.exerciseStats)
      .map(([exerciseName, stats]: [string, { totalVolume: number; totalSets: number }]) => ({
        exerciseName,
        totalVolume: stats.totalVolume,
        totalSets: stats.totalSets,
        averageWeight: stats.totalSets > 0 ? stats.totalVolume / stats.totalSets : 0,
        trend: 'stable' as const,
        percentChange: 0
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 10);

    return {
      totalWorkouts,
      totalExercises: counters.exerciseCount,
      totalSets: counters.setCount,
      totalDuration,
      avgDuration: Math.round(avgDuration),
      workoutTypes,
      tags: [],
      recommendedType: workoutTypes[0]?.type,
      recommendedDuration: Math.round(avgDuration),
      recommendedTags: [],
      progressMetrics: { volumeChangePercentage: 0, strengthTrend: 'stable', consistencyScore: 0 },
      streakDays: 0,
      workouts: sessions,
      timePatterns: {
        daysFrequency: counters.daysFrequency,
        durationByTimeOfDay: counters.durationByTimeOfDay
      },
      muscleFocus: counters.muscleFocus,
      exerciseVolumeHistory,
      lastWorkoutDate: sessions[0]?.start_time
    };
  }

  /**
   * Calculate processed metrics using existing workoutMetricsProcessor
   */
  private static calculateProcessedMetrics(workouts: any[], weightUnit: 'kg' | 'lb') {
    if (!workouts.length) return null;

    // Aggregate all exercises from all workouts
    const allExercises: Record<string, any[]> = {};
    let totalDuration = 0;

    workouts.forEach(workout => {
      totalDuration += workout.duration || 0;
      
      if (Array.isArray(workout.exercises)) {
        workout.exercises.forEach((set: any) => {
          if (!allExercises[set.exercise_name]) {
            allExercises[set.exercise_name] = [];
          }
          allExercises[set.exercise_name].push(set);
        });
      }
    });

    // Use existing processWorkoutMetrics function
    return processWorkoutMetrics(allExercises, totalDuration, weightUnit);
  }

  /**
   * Generate time series data for volume and density over time
   */
  private static generateTimeSeriesData(workouts: any[], weightUnit: 'kg' | 'lb') {
    const volumeByDate: Record<string, number> = {};
    const densityByDate: Record<string, number> = {};

    workouts.forEach(workout => {
      const date = new Date(workout.start_time).toISOString().split('T')[0];
      
      if (Array.isArray(workout.exercises)) {
        const workoutVolume = workout.exercises.reduce((sum: number, set: any) => {
          return set.completed ? sum + (set.weight * set.reps) : sum;
        }, 0);
        
        volumeByDate[date] = (volumeByDate[date] || 0) + workoutVolume;
        
        // Calculate density for this workout
        const duration = workout.duration || 1;
        const density = workoutVolume / duration;
        densityByDate[date] = Math.max(densityByDate[date] || 0, density);
      }
    });

    const volumeOverTimeData = Object.entries(volumeByDate)
      .map(([date, volume]) => ({ date, volume }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const densityOverTimeData = Object.entries(densityByDate)
      .map(([date, density]) => ({ date, density }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { volumeOverTimeData, densityOverTimeData };
  }

  /**
   * Extract chart data ensuring consistency between Performance Summary and charts
   */
  private static extractChartData(stats: WorkoutStats, processedMetrics: any) {
    return {
      workoutTypes: stats.workoutTypes || [],
      muscleFocus: stats.muscleFocus || {},
      timePatterns: stats.timePatterns || {
        daysFrequency: { monday:0, tuesday:0, wednesday:0, thursday:0, friday:0, saturday:0, sunday:0 },
        durationByTimeOfDay: { morning:0, afternoon:0, evening:0, night:0 }
      },
      exerciseVolumeHistory: stats.exerciseVolumeHistory || []
    };
  }

  /**
   * Calculate data availability flags
   */
  private static calculateDataFlags(workouts: any[], processedMetrics: any) {
    const hasWorkoutData = workouts.length > 0;
    const hasVolumeData = processedMetrics && processedMetrics.totalVolume > 0;
    const hasDensityData = processedMetrics && processedMetrics.densityMetrics?.overallDensity > 0;
    const efficiencyScore = processedMetrics?.efficiencyMetrics?.efficiencyScore || 0;

    return {
      hasVolumeData,
      hasDensityData,
      hasWorkoutData,
      efficiencyScore
    };
  }

  /**
   * Helper to get exercise muscle group (simplified version of existing function)
   */
  private static getExerciseMainMuscleGroup(exerciseName: string): string | null {
    const name = exerciseName.toLowerCase();
    
    if (name.includes('bench') || name.includes('chest') || name.includes('push-up')) return 'Chest';
    if (name.includes('squat') || name.includes('leg') || name.includes('quad')) return 'Legs';
    if (name.includes('deadlift') || name.includes('back') || name.includes('row')) return 'Back';
    if (name.includes('shoulder') || name.includes('press') || name.includes('overhead')) return 'Shoulders';
    if (name.includes('bicep') || name.includes('curl')) return 'Arms';
    if (name.includes('tricep') || name.includes('dip')) return 'Arms';
    if (name.includes('abs') || name.includes('plank') || name.includes('core')) return 'Core';
    
    return 'Other';
  }
}