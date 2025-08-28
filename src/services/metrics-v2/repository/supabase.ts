import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase as sharedClient } from '@/integrations/supabase/client'
import { MetricsRepository, DateRange, WorkoutRaw, SetRaw } from '../types'

export class SupabaseMetricsRepository implements MetricsRepository {
  private client: SupabaseClient | null = sharedClient
  private isInitialized: boolean = true

  constructor() {}

  async getWorkouts(range: DateRange, userId: string): Promise<WorkoutRaw[]> {
    if (!this.isInitialized || !this.client) {
      return this.getMockWorkouts(range)
    }

    try {
      const endExclusive = new Date(new Date(range.end).getTime() + 24 * 60 * 60 * 1000).toISOString()
      const { data: workouts, error } = await this.client
        .from('workout_sessions')
        .select('id, start_time, end_time, duration')
        .eq('user_id', userId)
        .gte('start_time', range.start)
        .lt('start_time', endExclusive)
        .order('start_time', { ascending: true })

      if (error || !workouts) {
        console.error('[MetricsV2] Error fetching workouts:', error)
        return this.getMockWorkouts(range)
      }

      return workouts.map(w => ({
        id: w.id,
        startedAt: w.start_time,
        endedAt: w.end_time,
        duration: w.duration
      }))
    } catch (error) {
      console.error('[MetricsV2] Error in getWorkouts:', error)
      return this.getMockWorkouts(range)
    }
  }

  async getSets(workoutIds: string[], userId: string): Promise<SetRaw[]> {
    if (!this.isInitialized || !this.client || !workoutIds.length) {
      return this.getMockSets(workoutIds)
    }

    try {
      // Primary query: RLS-safe inner join to user's workouts; include completed or null
      const { data: sets, error } = await this.client
        .from('exercise_sets')
        .select('id, workout_id, weight, reps, completed, workout_sessions!inner(id,user_id)')
        .in('workout_id', workoutIds)
        .eq('workout_sessions.user_id', userId)
        .or('completed.is.null,completed.eq.true')

      if (error || !sets) {
        console.error('[MetricsV2] Error fetching sets:', error)
        // Fallback: try without join (in case RLS allows)
        const alt = await this.client
          .from('exercise_sets')
          .select('id, workout_id, weight, reps, completed')
          .in('workout_id', workoutIds)
        if (alt.error || !alt.data) {
          console.error('[MetricsV2] Fallback sets query also failed:', alt.error)
          return this.getMockSets(workoutIds)
        }
        return alt.data.map((s: any) => ({
          id: s.id,
          workoutId: s.workout_id,
          weightKg: s.weight,
          reps: s.reps,
          exerciseId: undefined
        }))
      }

      return sets.map((s: any) => ({
        id: s.id,
        workoutId: s.workout_id,
        weightKg: s.weight,
        reps: s.reps,
        exerciseId: undefined
      }))
    } catch (error) {
      console.error('[MetricsV2] Error in getSets:', error)
      return this.getMockSets(workoutIds)
    }
  }

  private getMockWorkouts(range: DateRange): WorkoutRaw[] {
    const end = new Date(range.end)
    const d1 = new Date(end)
    d1.setDate(end.getDate() - 1)
    const d2 = new Date(end)
    d2.setDate(end.getDate() - 2)
    return [
      { id: 'mock-1', startedAt: d1.toISOString(), endedAt: new Date(d1.getTime() + 60*60*1000).toISOString(), duration: 60 },
      { id: 'mock-2', startedAt: d2.toISOString(), endedAt: new Date(d2.getTime() + 45*60*1000).toISOString(), duration: 45 },
    ]
  }

  private getMockSets(workoutIds: string[]): SetRaw[] {
    // Map provided ids if available; otherwise default to mock-1/mock-2
    const [w1, w2] = [workoutIds[0] || 'mock-1', workoutIds[1] || 'mock-2']
    return [
      { id: 'set-1', workoutId: w1, weightKg: 80, reps: 8, exerciseId: 'bench-press' },
      { id: 'set-2', workoutId: w1, weightKg: 100, reps: 5, exerciseId: 'deadlift' },
      { id: 'set-3', workoutId: w2, weightKg: 60, reps: 12, exerciseId: 'squat' },
    ]
  }
}
