import { SupabaseMetricsRepository } from './repository/supabase'
import { InMemoryMetricsRepository } from './types'
import type { DateRange } from './types'
import { getMetricsV2 as computeV2 } from './index'
import type { MetricsRepository as ComputeRepo, DateRange as ComputeRange } from './repository'

// Try to initialize Supabase repository, fallback to in-memory if it fails
let repository
try {
  repository = new SupabaseMetricsRepository()
} catch (error) {
  console.warn('Failed to initialize Supabase repository, falling back to in-memory:', error)
  repository = new InMemoryMetricsRepository()
}

export const metricsServiceV2 = {
  getMetricsV2: async ({ dateRange, userId }: { dateRange: DateRange; userId: string }) => {
    try {
      // Adapter: bridge our Supabase repository (string dates + RLS user) to compute's repo
      const adapter: ComputeRepo = {
        getWorkouts: async (range: ComputeRange, uid: string) => {
          const r: DateRange = { start: range.from.toISOString(), end: range.to.toISOString() }
          const ws = await repository.getWorkouts(r, uid)
          return ws.map(w => ({ id: w.id, startedAt: w.startedAt }))
        },
        getSets: async (workoutIds: string[]) => {
          const sets = await repository.getSets(workoutIds, userId)
          return sets.map(s => ({
            workoutId: s.workoutId,
            exerciseName: s.exerciseId || '',
            weightKg: s.weightKg,
            reps: s.reps,
            seconds: undefined,
            isBodyweight: false,
          }))
        },
      }

      const range: ComputeRange = { from: new Date(dateRange.start), to: new Date(dateRange.end) }
      const out = await computeV2(adapter, userId, range)
      console.log('[MetricsV2][debug] workouts:', out.totals.workouts, 'totalVolumeKg:', out.totals.totalVolumeKg, 'totalSets:', out.totals.totalSets)
      if (Array.isArray(out.series.volume) && out.series.volume.length === 0) {
        console.log('[MetricsV2][debug] No volume series returned; this may indicate no sets in range or join filter too strict', { range, userId })
      }
      // Augment with real duration from workout_sessions if available
      const workouts = await repository.getWorkouts(dateRange, userId)
      const totalDurationMin = workouts.reduce((sum, w) => sum + (w.duration || 0), 0)
      return {
        ...out,
        totals: { ...out.totals, durationMin: totalDurationMin },
      }
    } catch (error) {
      console.error('Error in getMetricsV2:', error)
      throw error
    }
  }
}
