import { SupabaseMetricsRepository } from './repository/supabase'
import { InMemoryMetricsRepository } from './types'
import type { DateRange } from './types'
import { getMetricsV2 as computeV2 } from './index'
import type { MetricsRepository as ComputeRepo, DateRange as ComputeRange } from './repository'
import { supabase } from '@/integrations/supabase/client'
import { isBodyweightExercise, getExerciseLoadFactor } from '@/utils/exerciseUtils'

// Try to initialize Supabase repository, fallback to in-memory if it fails
let repository
try {
  repository = new SupabaseMetricsRepository()
} catch (error) {
  console.warn('Failed to initialize Supabase repository, falling back to in-memory:', error)
  repository = new InMemoryMetricsRepository()
}

export const metricsServiceV2 = {
  getMetricsV2: async ({
    dateRange,
    userId,
    exerciseId,
    includeBodyweightLoads = false,
  }: {
    dateRange: DateRange;
    userId: string;
    exerciseId?: string;
    includeBodyweightLoads?: boolean;
  }) => {
    try {
      console.debug('[MetricsV2][debug] params', {
        startISO: dateRange.start,
        endISO: dateRange.end,
        includeBodyweightLoads,
      })
      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession()
      const sessionUserId = sessionData?.session?.user?.id

      if (sessionError || !sessionUserId) {
        console.error('[MetricsV2] Missing or invalid session when fetching metrics', {
          error: sessionError,
        })
        throw new Error('No active user session')
      }

      if (userId !== sessionUserId) {
        console.warn('[MetricsV2] Provided userId does not match session user; using session user', {
          provided: userId,
          sessionUserId,
        })
      }

      const effectiveUserId = sessionUserId

      let bodyweightKg = 70
      if (includeBodyweightLoads) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('bodyweight_kg')
            .eq('id', effectiveUserId)
            .single()
          const bw = (data as any)?.bodyweight_kg
          if (typeof bw === 'number') bodyweightKg = bw
        } catch {
          /* ignore */
        }
      }

      // Fetch raw data first via repository (with built-in fallbacks)
      const rawWorkouts = await repository.getWorkouts(dateRange, effectiveUserId)
      const workoutIds = rawWorkouts.map(w => w.id)
      const rawSets = await repository.getSets(workoutIds, effectiveUserId, exerciseId)
      const sets = exerciseId
        ? rawSets.filter(s => s.exerciseId === exerciseId)
        : rawSets

      // Compute simple totals directly from repository data (authoritative)
      let totalSets = 0
      let totalReps = 0
      let totalWorkouts = rawWorkouts.length
      let durationMin = rawWorkouts.reduce((a, w) => a + (Number(w.duration) || 0), 0)
      let totalVolumeKg = 0

      // Convert repository data to aggregator types
      const setsForAggregator = rawSets.map(s => ({
        id: s.id,
        workoutId: s.workoutId,
        weightKg: Number(s.weightKg) || 0,
        reps: Number(s.reps) || 0,
        exerciseId: s.exerciseId,
        exerciseName: s.exerciseName,
        failurePoint: s.failurePoint,
        formScore: s.formScore,
        restTimeSec: Number(s.restTimeSec) || 0,
      }));

      const workoutsForAggregator = rawWorkouts.map(w => ({
        id: w.id,
        startedAt: w.startedAt,
        endedAt: w.endedAt,
        duration: Number(w.duration) || 0,
      }));

      // Build series per day based on repository data
      const volByDay = new Map<string, number>()
      const setsCountByDay = new Map<string, number>()
      const repsByDay = new Map<string, number>()
      const workoutsByDay = new Map<string, number>()
      const durationByDay = new Map<string, number>()
      for (const s of sets) {
        const w = rawWorkouts.find(w => w.id === s.workoutId)
        if (!w) continue
        const day = new Date(w.startedAt).toISOString().split('T')[0]
        let weight = Number(s.weightKg) || 0
        if (
          includeBodyweightLoads &&
          weight <= 0 &&
          isBodyweightExercise(s.exerciseName || '')
        ) {
          weight = bodyweightKg * getExerciseLoadFactor(s.exerciseName || '')
        }
        const reps = Number(s.reps) || 0
        const inc = weight * reps
        totalVolumeKg += inc
        totalSets += 1
        totalReps += reps
        volByDay.set(day, (volByDay.get(day) || 0) + inc)
        setsCountByDay.set(day, (setsCountByDay.get(day) || 0) + 1)
        repsByDay.set(day, (repsByDay.get(day) || 0) + reps)
      }
      const repoVolumeSeries = Array.from(volByDay.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date))
      console.debug('[MetricsV2][debug] series points:', repoVolumeSeries.length)
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
        getSets: async (workoutIds: string[], exId?: string) => {
          const sets = await repository.getSets(
            workoutIds,
            effectiveUserId,
            exId ?? exerciseId
          )
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
      const out = await computeV2(adapter, effectiveUserId, range)
      console.log('[MetricsV2][debug] repoTotals -> workouts:', totalWorkouts, 'totalVolumeKg:', totalVolumeKg, 'totalSets:', totalSets)
      if (Array.isArray(out.series.tonnage_kg) && out.series.tonnage_kg.length === 0 && repoVolumeSeries.length > 0) {
        console.log('[MetricsV2][debug] No tonnage series returned; this may indicate no sets in range or join filter too strict', { range, userId: effectiveUserId })
      }

      // Use new aggregators for enhanced metrics including KPIs
      const { aggregatePerWorkout, aggregateTotals, aggregateTotalsKpis } = await import('./aggregators');
      const perWorkout = aggregatePerWorkout(workoutsForAggregator, setsForAggregator);
      const totalsKpis = aggregateTotalsKpis(perWorkout);

      // Prefer repository-derived totals/series to avoid zeros when compute pipeline returns empty
      const metricKeys = [
        'tonnage_kg',
        'sets',
        'reps',
        'workouts',
        'duration',
        'density_kg_min',
        'avg_rest_ms',
        'set_efficiency_pct',
      ]

      const result = {
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
          tonnage_kg: repoVolumeSeries,
          sets: repoSetsSeries,
          reps: repoRepsSeries,
          workouts: repoWorkoutsSeries,
          density_kg_min: out.series.density_kg_min || [],
          cvr: out.series.cvr || [],
          duration: repoDurationSeries,
          avg_rest_ms: out.series.avg_rest_ms || [],
          set_efficiency_pct: out.series.set_efficiency_pct || [],
        },
        metricKeys,
        perWorkout,
        totalsKpis,
      }
      console.debug('[v2] keys', { totals: Object.keys(result.totals || {}), series: Object.keys(result.series || {}) })
      return result
    } catch (error) {
      console.error('Error in getMetricsV2:', error)
      throw error
    }
  }
  ,
  _getRepo() {
    return repository
  }
}
