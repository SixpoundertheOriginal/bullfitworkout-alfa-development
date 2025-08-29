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
      // Fetch raw data first via repository (with built-in fallbacks)
      const rawWorkouts = await repository.getWorkouts(dateRange, userId)
      const workoutIds = rawWorkouts.map(w => w.id)
      const rawSets = await repository.getSets(workoutIds, userId)

      // Compute simple totals directly from repository data (authoritative)
      const totalSets = rawSets.length
      const totalReps = rawSets.reduce((a, s) => a + (Number(s.reps) || 0), 0)
      const totalWorkouts = rawWorkouts.length
      const durationMin = rawWorkouts.reduce((a, w) => a + (Number(w.duration) || 0), 0)
      const totalVolumeKg = rawSets.reduce((a, s) => a + (Number(s.weightKg) || 0) * (Number(s.reps) || 0), 0)

      // Build series per day based on repository data
      const volByDay = new Map<string, number>()
      const setsCountByDay = new Map<string, number>()
      const repsByDay = new Map<string, number>()
      const workoutsByDay = new Map<string, number>()
      const durationByDay = new Map<string, number>()
      for (const s of rawSets) {
        const w = rawWorkouts.find(w => w.id === s.workoutId)
        if (!w) continue
        const day = new Date(w.startedAt).toISOString().split('T')[0]
        const inc = (Number(s.weightKg) || 0) * (Number(s.reps) || 0)
        volByDay.set(day, (volByDay.get(day) || 0) + inc)
        setsCountByDay.set(day, (setsCountByDay.get(day) || 0) + 1)
        repsByDay.set(day, (repsByDay.get(day) || 0) + (Number(s.reps) || 0))
      }
      const repoVolumeSeries = Array.from(volByDay.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date))
      const repoSetsSeries = Array.from(setsCountByDay.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date))
      const repoRepsSeries = Array.from(repsByDay.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date))
      // Build workouts + duration series
      for (const w of rawWorkouts) {
        const day = new Date(w.startedAt).toISOString().split('T')[0]
        workoutsByDay.set(day, (workoutsByDay.get(day) || 0) + 1)
        durationByDay.set(day, (durationByDay.get(day) || 0) + (Number(w.duration) || 0))
      }
      const repoWorkoutsSeries = Array.from(workoutsByDay.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date))
      const repoDurationSeries = Array.from(durationByDay.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date))

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
            exerciseName: s.exerciseName || s.exerciseId || '',
            weightKg: s.weightKg,
            reps: s.reps,
            seconds: undefined,
            isBodyweight: false,
          }))
        },
      }

      const range: ComputeRange = { from: new Date(dateRange.start), to: new Date(dateRange.end) }
      const out = await computeV2(adapter, userId, range)
      console.log('[MetricsV2][debug] repoTotals -> workouts:', totalWorkouts, 'totalVolumeKg:', totalVolumeKg, 'totalSets:', totalSets)
      if (Array.isArray(out.series.volume) && out.series.volume.length === 0 && repoVolumeSeries.length > 0) {
        console.log('[MetricsV2][debug] No volume series returned; this may indicate no sets in range or join filter too strict', { range, userId })
      }

      // Enrich perWorkout with real durations when available
      const durationById = new Map<string, number>()
      rawWorkouts.forEach(w => durationById.set(w.id, Number(w.duration) || 0))
      const perWorkout = (out.perWorkout || []).map(w => ({
        ...w,
        durationMin: durationById.get(w.workoutId) ?? w.durationMin ?? 0,
      }))

      // Prefer repository-derived totals/series to avoid zeros when compute pipeline returns empty
      return {
        ...out,
        totals: {
          ...out.totals,
          totalVolumeKg,
          totalSets,
          totalReps,
          workouts: totalWorkouts,
          durationMin,
        },
        series: {
          ...out.series,
          // Use repo series in UI (select() in Analytics handles both {date,value} and {x,y})
          volume: repoVolumeSeries,
          sets: repoSetsSeries,
          reps: repoRepsSeries,
          workouts: repoWorkoutsSeries,
          density: out.series.density || [],
          cvr: out.series.cvr || [],
          // duration series in minutes per day
          duration: repoDurationSeries,
        },
        perWorkout,
      }
    } catch (error) {
      console.error('Error in getMetricsV2:', error)
      throw error
    }
  }
}
