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

      if (error) {
        console.error('[MetricsV2] Error fetching workouts:', error)
        return this.getMockWorkouts(range)
      }

      let list = workouts || []
      if (!list.length) {
        console.warn('[MetricsV2] No workouts in range via DB filter; retrying without range and filtering in app', { range, userId })
        const alt = await this.client
          .from('workout_sessions')
          .select('id, start_time, end_time, duration')
          .eq('user_id', userId)
          .order('start_time', { ascending: true })
        if (!alt.error && alt.data) {
          const from = new Date(range.start).getTime()
          const to = new Date(endExclusive).getTime()
          list = alt.data.filter((w: any) => {
            const t = new Date(w.start_time).getTime()
            return t >= from && t < to
          })
          console.log('[MetricsV2] Fallback workouts filtered in app:', list.length)
        } else {
          console.error('[MetricsV2] Fallback workouts query failed:', alt.error)
        }
      }

      return list.map((w: any) => ({
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

  async getSets(workoutIds: string[], userId: string, exerciseId?: string): Promise<SetRaw[]> {

    if (!this.isInitialized || !this.client || !workoutIds.length) {
      return this.getMockSets(workoutIds)
    }

    try {
      console.log('[MetricsV2] getSets called', {
        workoutIdsCount: workoutIds.length,
        sample: workoutIds.slice(0, 5),
        t: new Date().toISOString(),
      })

      // Sanitize ids and verify ownership to satisfy RLS before sets fetch
      const validIds = workoutIds.filter(id => typeof id === 'string' && id.trim().length > 0)
      if (validIds.length === 0) return []
      const { data: ownedW, error: ownErr } = await this.client
        .from('workout_sessions')
        .select('id')
        .in('id', validIds)
        .eq('user_id', userId)
      if (ownErr) console.warn('[MetricsV2] Ownership precheck failed', ownErr)
      const ownedIds = (ownedW || []).map(w => w.id)
      if (ownedIds.length === 0) return []

      // Primary RLS-safe join query
      let { data: sets, error } = await this.client
        .from('exercise_sets')
        .select('id, workout_id, exercise_id, exercise_name, weight, reps, completed, failure_point, form_quality, rest_time, started_at, completed_at, timing_quality, workout_sessions!inner(id,user_id)')
        .in('workout_id', ownedIds)
        .eq('workout_sessions.user_id', userId)
        .or('completed.is.null,completed.eq.true')

      if (error) {
        console.error('[MetricsV2] Error fetching sets (joined):', error)
        // Fallback: non-join query (still constrained to ownedIds)
        const alt = await this.client
          .from('exercise_sets')
          .select('id, workout_id, exercise_id, exercise_name, weight, reps, completed, failure_point, form_quality, rest_time, started_at, completed_at, timing_quality')
          .in('workout_id', ownedIds)
        if (alt.error || !alt.data) {
          console.error('[MetricsV2] Fallback sets query also failed:', alt.error)
          return this.getMockSets(workoutIds)
        }
        sets = alt.data as any
      }

      // Optional exerciseId filter
      if (exerciseId) sets = (sets || []).filter((s: any) => s.exercise_id === exerciseId)

      if (!sets || sets.length === 0) return []

      return (sets as any[]).map((s: any) => ({
        id: s.id,
        workoutId: s.workout_id,
        weightKg: s.weight,
        reps: s.reps,
        exerciseId: s.exercise_id,
        exerciseName: s.exercise_name ?? s.exercise_id,
        failurePoint: s.failure_point ?? null,
        formScore: s.form_quality ?? null,
        restTimeSec: s.rest_time ?? null,
        startedAt: s.started_at ?? undefined,
        completedAt: s.completed_at ?? undefined,
        timingQuality: s.timing_quality ?? undefined,
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
      { id: 'set-1', workoutId: w1, weightKg: 80, reps: 8, exerciseId: 'bench-press', failurePoint: 'none', formScore: 3, restTimeSec: 120 },
      { id: 'set-2', workoutId: w1, weightKg: 100, reps: 5, exerciseId: 'deadlift', failurePoint: 'muscular', formScore: 4, restTimeSec: 180 },
      { id: 'set-3', workoutId: w2, weightKg: 60, reps: 12, exerciseId: 'squat', failurePoint: 'technical', formScore: 2, restTimeSec: 90 },
    ]
  }

  // New helper to list user's exercises within optional range
  async getUserExercises(userId: string, range?: DateRange): Promise<Array<{ id?: string; name: string }>> {
    if (!this.client) return []
    try {
      let q = this.client
        .from('exercise_sets')
        .select('exercise_id, exercise_name, workout_sessions!inner(user_id, start_time)')
        .eq('workout_sessions.user_id', userId)
      if (range) {
        const endExclusive = new Date(new Date(range.end).getTime() + 24 * 60 * 60 * 1000).toISOString()
        q = q.gte('workout_sessions.start_time', range.start).lt('workout_sessions.start_time', endExclusive)
      }
      const { data, error } = await q
      if (error) {
        console.error('[MetricsV2] getUserExercises error:', error)
        return []
      }
      const dedup = new Map<string, { id?: string; name: string }>()
      ;(data || []).forEach((row: any) => {
        const key = row.exercise_id || row.exercise_name
        if (!key) return
        if (!dedup.has(key)) dedup.set(key, { id: row.exercise_id || undefined, name: row.exercise_name })
      })
      return Array.from(dedup.values())
    } catch (e) {
      console.error('[MetricsV2] getUserExercises exception:', e)
      return []
    }
  }
}
