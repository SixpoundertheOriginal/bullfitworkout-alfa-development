import { WorkoutSession, ExerciseSet } from '@/types/workout';
import { WorkoutInsight, UserTrainingProfile, PerformanceMetrics } from '@/types/ai-enhanced';
import { supabase } from '@/integrations/supabase/client';

export class InsightsEngine {
  private static instance: InsightsEngine;
  
  static getInstance(): InsightsEngine {
    if (!InsightsEngine.instance) {
      InsightsEngine.instance = new InsightsEngine();
    }
    return InsightsEngine.instance;
  }

  async generateWorkoutInsights(
    userId: string,
    recentWorkouts: WorkoutSession[],
    exerciseSets: ExerciseSet[],
    userProfile?: UserTrainingProfile
  ): Promise<WorkoutInsight[]> {
    const startTime = performance.now();
    
    try {
      const insights: WorkoutInsight[] = [];
      
      // Generate different types of insights
      insights.push(...await this.generateProgressInsights(recentWorkouts, exerciseSets));
      insights.push(...await this.generateConsistencyInsights(recentWorkouts));
      insights.push(...await this.generatePerformanceInsights(exerciseSets));
      insights.push(...await this.generateRecommendationInsights(recentWorkouts, userProfile));
      insights.push(...await this.generateMilestoneInsights(userId, recentWorkouts));
      
      // Sort by priority and confidence
      const sortedInsights = insights
        .filter(insight => insight.confidence > 0.6)
        .sort((a, b) => {
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          return (priorityWeight[b.priority] * b.confidence) - (priorityWeight[a.priority] * a.confidence);
        })
        .slice(0, 6); // Return top 6 insights

      const responseTime = performance.now() - startTime;
      this.trackPerformance('generateWorkoutInsights', responseTime, sortedInsights.length);
      
      return sortedInsights;
    } catch (error) {
      console.error('Error generating workout insights:', error);
      return this.getFallbackInsights(recentWorkouts);
    }
  }

  private async generateProgressInsights(
    workouts: WorkoutSession[],
    exerciseSets: ExerciseSet[]
  ): Promise<WorkoutInsight[]> {
    const insights: WorkoutInsight[] = [];
    
    if (workouts.length < 2) return insights;

    // Analyze volume progression
    const recentVolume = this.calculateTotalVolume(exerciseSets.filter(set => 
      workouts.slice(-3).some(w => w.id === set.workout_id)
    ));
    
    const olderVolume = this.calculateTotalVolume(exerciseSets.filter(set => 
      workouts.slice(-6, -3).some(w => w.id === set.workout_id)
    ));

    if (recentVolume > olderVolume * 1.1) {
      insights.push({
        id: `progress_volume_${Date.now()}`,
        type: 'achievement',
        title: 'Volume Progress Detected! 📈',
        description: `Your training volume has increased by ${Math.round(((recentVolume - olderVolume) / olderVolume) * 100)}% recently.`,
        actionable: 'Keep up the great work! Consider tracking your recovery to maintain this momentum.',
        confidence: 0.85,
        priority: 'high',
        metadata: { volumeIncrease: recentVolume - olderVolume, percentage: ((recentVolume - olderVolume) / olderVolume) * 100 }
      });
    }

    // Analyze consistency
    const workoutDays = workouts.slice(-14).map(w => new Date(w.start_time).getDay());
    const uniqueDays = new Set(workoutDays).size;
    
    if (uniqueDays >= 3 && workouts.slice(-7).length >= 3) {
      insights.push({
        id: `progress_consistency_${Date.now()}`,
        type: 'achievement',
        title: 'Consistency Champion! 🏆',
        description: `You've maintained a consistent workout schedule across ${uniqueDays} different days.`,
        confidence: 0.9,
        priority: 'medium',
        metadata: { uniqueDays, recentWorkouts: workouts.slice(-7).length }
      });
    }

    return insights;
  }

  private async generateConsistencyInsights(workouts: WorkoutSession[]): Promise<WorkoutInsight[]> {
    const insights: WorkoutInsight[] = [];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const lastWeekWorkouts = workouts.filter(w => new Date(w.start_time) >= oneWeekAgo);
    const previousWeekWorkouts = workouts.filter(w => {
      const date = new Date(w.start_time);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    });

    // Check for improved frequency
    if (lastWeekWorkouts.length > previousWeekWorkouts.length && lastWeekWorkouts.length >= 3) {
      insights.push({
        id: `consistency_improvement_${Date.now()}`,
        type: 'trend',
        title: 'Frequency is Improving! 📅',
        description: `You worked out ${lastWeekWorkouts.length} times this week, up from ${previousWeekWorkouts.length} last week.`,
        actionable: 'Try to maintain this rhythm for the next two weeks to build a solid habit.',
        confidence: 0.8,
        priority: 'medium',
        metadata: { thisWeek: lastWeekWorkouts.length, lastWeek: previousWeekWorkouts.length }
      });
    }

    // Check for workout timing patterns
    const preferredHours = this.analyzeWorkoutTiming(workouts.slice(-10));
    if (preferredHours.consistency > 0.7) {
      insights.push({
        id: `timing_pattern_${Date.now()}`,
        type: 'trend',
        title: 'Perfect Timing! ⏰',
        description: `You consistently work out around ${preferredHours.hour}:00. This routine can boost adherence.`,
        confidence: 0.75,
        priority: 'low',
        metadata: { preferredHour: preferredHours.hour, consistency: preferredHours.consistency }
      });
    }

    return insights;
  }

  private async generatePerformanceInsights(exerciseSets: ExerciseSet[]): Promise<WorkoutInsight[]> {
    const insights: WorkoutInsight[] = [];
    
    // Analyze strength progression per exercise
    const exerciseProgress = this.analyzeExerciseProgress(exerciseSets);
    
    Object.entries(exerciseProgress).forEach(([exercise, progress]) => {
      if (progress.weightIncrease > 0.05 && progress.sessions >= 3) {
        insights.push({
          id: `performance_${exercise}_${Date.now()}`,
          type: 'achievement',
          title: `${exercise} Strength Gains! 💪`,
          description: `Your ${exercise} performance has improved by ${Math.round(progress.weightIncrease * 100)}% over ${progress.sessions} sessions.`,
          actionable: `Consider progressive overload: add ${Math.round(progress.averageWeight * 0.025)}kg to your next ${exercise} session.`,
          confidence: 0.8,
          priority: 'high',
          metadata: { exercise, improvement: progress.weightIncrease, sessions: progress.sessions }
        });
      }
    });

    return insights;
  }

  private async generateRecommendationInsights(
    workouts: WorkoutSession[],
    userProfile?: UserTrainingProfile
  ): Promise<WorkoutInsight[]> {
    const insights: WorkoutInsight[] = [];
    
    // Analyze training balance
    const trainingTypes = workouts.slice(-10).reduce((acc, workout) => {
      acc[workout.training_type] = (acc[workout.training_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalWorkouts = Object.values(trainingTypes).reduce((sum, count) => sum + count, 0);
    const dominantType = Object.entries(trainingTypes).reduce((max, current) => 
      current[1] > max[1] ? current : max
    );

    if (totalWorkouts >= 5 && dominantType[1] / totalWorkouts > 0.8) {
      insights.push({
        id: `recommendation_variety_${Date.now()}`,
        type: 'recommendation',
        title: 'Mix It Up! 🔄',
        description: `${Math.round((dominantType[1] / totalWorkouts) * 100)}% of your recent workouts are ${dominantType[0]}. Adding variety can boost progress.`,
        actionable: 'Try incorporating 1-2 different training types this week for balanced development.',
        confidence: 0.7,
        priority: 'medium',
        metadata: { dominantType: dominantType[0], percentage: (dominantType[1] / totalWorkouts) * 100 }
      });
    }

    // Recovery recommendations
    const avgDuration = workouts.slice(-5).reduce((sum, w) => sum + w.duration, 0) / Math.min(workouts.length, 5);
    if (avgDuration > 90) {
      insights.push({
        id: `recommendation_recovery_${Date.now()}`,
        type: 'recommendation',
        title: 'Recovery Focus Recommended 🛌',
        description: `Your recent workouts average ${Math.round(avgDuration)} minutes. Longer sessions need more recovery.`,
        actionable: 'Consider adding a rest day or light activity session between intense workouts.',
        confidence: 0.6,
        priority: 'medium',
        metadata: { averageDuration: avgDuration }
      });
    }

    return insights;
  }

  private async generateMilestoneInsights(userId: string, workouts: WorkoutSession[]): Promise<WorkoutInsight[]> {
    const insights: WorkoutInsight[] = [];
    
    // Check for milestone achievements
    const totalWorkouts = workouts.length;
    const milestones = [10, 25, 50, 100, 200];
    
    const nearestMilestone = milestones.find(m => m > totalWorkouts);
    if (nearestMilestone && nearestMilestone - totalWorkouts <= 3) {
      insights.push({
        id: `milestone_approaching_${Date.now()}`,
        type: 'milestone',
        title: `Milestone Alert! 🎯`,
        description: `You're only ${nearestMilestone - totalWorkouts} workouts away from ${nearestMilestone} total sessions!`,
        actionable: 'Keep pushing towards this amazing milestone!',
        confidence: 1.0,
        priority: 'high',
        metadata: { current: totalWorkouts, target: nearestMilestone, remaining: nearestMilestone - totalWorkouts }
      });
    }

    // Check for workout streaks
    const streak = this.calculateWorkoutStreak(workouts);
    if (streak >= 7) {
      insights.push({
        id: `milestone_streak_${Date.now()}`,
        type: 'milestone',
        title: `${streak}-Day Streak! 🔥`,
        description: `You've been consistently working out for ${streak} days straight. Incredible dedication!`,
        confidence: 0.95,
        priority: 'high',
        metadata: { streak }
      });
    }

    return insights;
  }

  private calculateTotalVolume(exerciseSets: ExerciseSet[]): number {
    return exerciseSets.reduce((total, set) => total + (set.weight * set.reps), 0);
  }

  private analyzeWorkoutTiming(workouts: WorkoutSession[]): { hour: number; consistency: number } {
    const hours = workouts.map(w => new Date(w.start_time).getHours());
    const hourCounts = hours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const mostCommonHour = Object.entries(hourCounts).reduce((max, current) => 
      parseInt(current[1] as any) > parseInt(max[1] as any) ? current : max
    );

    const consistency = parseInt(mostCommonHour[1] as any) / workouts.length;
    
    return {
      hour: parseInt(mostCommonHour[0]),
      consistency
    };
  }

  private analyzeExerciseProgress(exerciseSets: ExerciseSet[]): Record<string, any> {
    const exerciseData: Record<string, ExerciseSet[]> = {};
    
    exerciseSets.forEach(set => {
      if (!exerciseData[set.exercise_name]) {
        exerciseData[set.exercise_name] = [];
      }
      exerciseData[set.exercise_name].push(set);
    });

    const progress: Record<string, any> = {};
    
    Object.entries(exerciseData).forEach(([exercise, sets]) => {
      if (sets.length < 3) return; // Need at least 3 data points
      
      const sortedSets = sets.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const firstThird = sortedSets.slice(0, Math.floor(sortedSets.length / 3));
      const lastThird = sortedSets.slice(-Math.floor(sortedSets.length / 3));
      
      const avgWeightFirst = firstThird.reduce((sum, set) => sum + set.weight, 0) / firstThird.length;
      const avgWeightLast = lastThird.reduce((sum, set) => sum + set.weight, 0) / lastThird.length;
      
      progress[exercise] = {
        sessions: sets.length,
        weightIncrease: (avgWeightLast - avgWeightFirst) / avgWeightFirst,
        averageWeight: avgWeightLast,
        firstAvg: avgWeightFirst,
        lastAvg: avgWeightLast
      };
    });

    return progress;
  }

  private calculateWorkoutStreak(workouts: WorkoutSession[]): number {
    if (workouts.length === 0) return 0;
    
    const sortedWorkouts = workouts
      .map(w => new Date(w.start_time).toDateString())
      .sort()
      .reverse();
    
    const uniqueDates = [...new Set(sortedWorkouts)];
    const today = new Date().toDateString();
    
    let streak = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < 30; i++) { // Check last 30 days max
      const dateStr = currentDate.toDateString();
      if (uniqueDates.includes(dateStr)) {
        streak++;
      } else if (streak > 0) {
        break; // Streak broken
      }
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  }

  private getFallbackInsights(workouts: WorkoutSession[]): WorkoutInsight[] {
    const insights: WorkoutInsight[] = [];
    
    if (workouts.length > 0) {
      insights.push({
        id: `fallback_${Date.now()}`,
        type: 'trend',
        title: 'Keep Going! 💪',
        description: `You've completed ${workouts.length} workout${workouts.length === 1 ? '' : 's'}. Every session counts towards your goals.`,
        confidence: 0.8,
        priority: 'medium',
        metadata: { totalWorkouts: workouts.length }
      });
    }

    return insights;
  }

  private trackPerformance(operation: string, responseTime: number, insightCount: number): void {
    if (responseTime > 200) {
      console.warn(`InsightsEngine.${operation} took ${responseTime}ms (>200ms threshold)`);
    }
    
    // Analytics tracking could go here
    // analytics.track('ai_insights_performance', { operation, responseTime, insightCount });
  }
}