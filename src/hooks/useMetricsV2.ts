import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { metricsServiceV2 } from '@/services/metrics-v2/service';
import type { AnalyticsServiceData } from '@/pages/analytics/AnalyticsPage';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { DEFS_VERSION } from '@/services/metrics-v2/registry';
import { TONNAGE_ID, AVG_REST_ID, EFF_ID } from '@/pages/analytics/metricIds';
import { normalizeSeriesKeys, normalizeTotals } from '@/services/metrics-v2/chartAdapter';
import { toCanonicalTotals } from './useMetricsV2.helpers';
import type { TimeSeriesPoint } from '@/services/metrics-v2/types';

// Factory for stable params
function buildMetricsParams(opts: {
  startISO: string;
  endISO: string;
  userId: string;
  unit: 'kg';
  tz: 'Europe/Warsaw';
  includeBodyweight?: boolean;
  includeTimePeriodAverages?: boolean;
  bodyweightKg?: number;
}) {
  return Object.freeze({
    startISO: opts.startISO,
    endISO: opts.endISO,
    userId: opts.userId,
    unit: opts.unit,
    tz: opts.tz,
    includeBodyweight: opts.includeBodyweight ?? false,
    includeTimePeriodAverages: opts.includeTimePeriodAverages ?? false,
    bodyweightKg: opts.bodyweightKg ?? 75,
  });
}

// V2 DTO type with required structure
export type MetricsV2Data = {
  meta: {
    version: 'v2';
    generatedAt: string;
    tz: 'Europe/Warsaw';
    unit: 'kg';
  };
  inputs: {
    startISO: string;
    endISO: string;
    userId: string;
    unit: 'kg';
    tz: 'Europe/Warsaw';
  };
  kpis: {
    sets: number;
    reps: number;
    duration_min: number;
    tonnage_kg: number;
    density_kg_per_min: number;
    avg_rest_sec?: number;
    set_efficiency_kg_per_min?: number | null;
    // deprecated camelCase aliases
    durationMin?: number;
    tonnageKg?: number;
    densityKgPerMin?: number;
    avgRestSec?: number;
    setEfficiencyKgPerMin?: number | null;
  };
  // per-day time series used by charts (camelCase keys, timestamps)
  series?: {
    sets?: { timestamp: string; value: number }[];
    reps?: { timestamp: string; value: number }[];
    durationMin?: { timestamp: string; value: number }[];
    tonnageKg?: { timestamp: string; value: number }[];
    densityKgPerMin?: { timestamp: string; value: number }[];
    avgRestSec?: { timestamp: string; value: number }[];
    setEfficiencyKgPerMin?: { timestamp: string; value: number }[];
  };
  timingMetadata?: { coveragePct: number; quality: 'high' | 'medium' | 'low' };
  totals?: Record<string, number>;
  error?: string;
};

interface RangeParams {
  startISO: string;
  endISO: string;
  includeBodyweightLoads?: boolean;
  includeTimePeriodAverages?: boolean;
  bodyweightKg?: number;
}

// Legacy useMetricsV2 with stable query key
export default function useMetricsV2(
  userId?: string,
  range?: RangeParams
) {
  const includeBodyweight = range?.includeBodyweightLoads ?? FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED;
  const includeTimePeriodAverages = range?.includeTimePeriodAverages ?? false;
  const bodyweightKg = range?.bodyweightKg ?? 75;
  const startISO = range?.startISO;
  const endISO = range?.endISO;
  
  // Create stable day boundaries from ISO strings to prevent query key churn
  const queryKey = React.useMemo(() => {
    if (!startISO || !endISO) return ['metricsV2', null];
    const startDay = startISO.split('T')[0];
    const endDay = endISO.split('T')[0];
    return ['metricsV2', startDay, endDay, includeBodyweight, includeTimePeriodAverages, bodyweightKg, DEFS_VERSION];
  }, [startISO, endISO, includeBodyweight, includeTimePeriodAverages, bodyweightKg]);
  
  return useQuery<AnalyticsServiceData>({
    queryKey,
    queryFn: () => {
      console.debug('[MetricsV2][debug] params', {
        startISO,
        endISO,
        includeBodyweightLoads: includeBodyweight,
        includeTimePeriodAverages,
        bodyweightKg,
      });
        return metricsServiceV2
          .getMetricsV2({
            userId: userId!,
            dateRange: { start: startISO!, end: endISO! },
            includeBodyweightLoads: includeBodyweight,
            includeTimePeriodAverages,
            bodyweightKg,
          })
          .then((res: AnalyticsServiceData) => {
            const keyMap: Record<string, string> = {
              tonnageKg: 'tonnage_kg',
              durationMin: 'duration_min',
              densityKgPerMin: 'density_kg_per_min',
            };
            if (res?.series) {
              res.series = Object.fromEntries(
                Object.entries(res.series).map(([k, v]) => [keyMap[k as keyof typeof keyMap] || k, v])
              );
            }
            res.totals = toCanonicalTotals(res.totals);
            if (FEATURE_FLAGS?.KPI_DIAGNOSTICS_ENABLED) {
              console.debug('[MetricsV2][debug] totals (canonical)', res.totals);
            }
            const points = res?.series?.[TONNAGE_ID]?.length || 0;
            console.debug('[MetricsV2][debug] series points:', points);
            return res as AnalyticsServiceData;
          });
    },
    enabled: !!userId && !!startISO && !!endISO,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: false,
  });
}

// New V2-specific hook for analytics
export function useMetricsV2Analytics(
  userId?: string,
  range?: { startISO: string; endISO: string }
) {
  const requestId = React.useRef(`req-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  
  const params = React.useMemo(() => {
    if (!userId || !range?.startISO || !range?.endISO) return null;
    return buildMetricsParams({
      startISO: range.startISO,
      endISO: range.endISO,
      userId,
      unit: 'kg',
      tz: 'Europe/Warsaw',
    });
  }, [userId, range?.startISO, range?.endISO]);

  return useQuery<MetricsV2Data>({
    queryKey: ['metrics-v2', params],
    queryFn: async (): Promise<MetricsV2Data> => {
      const t0 = performance.now();
      const fromCache = false; // TODO: detect from TanStack Query
      
      try {
        const response = await metricsServiceV2.getMetricsV2({
          userId: params!.userId,
          dateRange: { start: params!.startISO, end: params!.endISO },
          includeBodyweightLoads: params!.includeBodyweight,
          includeTimePeriodAverages: params!.includeTimePeriodAverages,
          bodyweightKg: params!.bodyweightKg,
        });

        const durationMs = performance.now() - t0;
        
        // Canonicalize totals and apply 2-decimal rounding
        const norm = normalizeTotals(response.totals || {});
        const round2 = (n: number) => Math.round(n * 100) / 100;
        const duration_min = round2(norm.duration_min ?? 0);
        const tonnage_kg = round2(norm.tonnage_kg ?? 0);
        const density_kg_per_min = round2(
          norm.density_kg_per_min ?? tonnage_kg / Math.max(duration_min, 0.01)
        );
        const totals = {
          sets: norm.sets ?? 0,
          reps: norm.reps ?? 0,
          duration_min,
          tonnage_kg,
          density_kg_per_min,
        };
        if (FEATURE_FLAGS.KPI_DIAGNOSTICS_ENABLED) {
          console.debug('[MetricsV2][debug] totals (canonical)', totals);
        }
        const timingMetadata = response.timingMetadata;
        const derivedFlag = FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED;
        const includeRest = derivedFlag && timingMetadata?.quality === 'high';
        const avg_rest_sec = includeRest
          ? round2(norm[AVG_REST_ID] ?? 0)
          : undefined;
        const set_efficiency_kg_per_min = derivedFlag
          ? round2(norm[EFF_ID] ?? 0)
          : undefined;

        const keyMap: Record<string, string> = {
          densityKgPerMin: 'density_kg_per_min',
          density: 'density_kg_per_min',
          density_kg_min: 'density_kg_per_min',
          avgRestSec: 'avg_rest_sec',
          setEfficiencyKgPerMin: 'set_efficiency_kg_per_min',
          set_count: 'sets',
          sets_count: 'sets',
          total_sets: 'sets',
          rep_count: 'reps',
          reps_total: 'reps',
          total_reps: 'reps',
        };
        const normalized = normalizeSeriesKeys(
          Object.fromEntries(
            Object.entries(response.series || {}).map(([k, v]) => [keyMap[k] || k, v])
          )
        );

        const series = {
          sets: (normalized.sets || []).map((p: TimeSeriesPoint) => ({ timestamp: `${p.date}T00:00:00.000Z`, value: p.value })),
          reps: (normalized.reps || []).map((p: TimeSeriesPoint) => ({ timestamp: `${p.date}T00:00:00.000Z`, value: p.value })),
          durationMin: (normalized.duration_min || []).map((p: TimeSeriesPoint) => ({ timestamp: `${p.date}T00:00:00.000Z`, value: p.value })),
          tonnageKg: (normalized.tonnage_kg || []).map((p: TimeSeriesPoint) => ({ timestamp: `${p.date}T00:00:00.000Z`, value: p.value })),
          densityKgPerMin: (normalized.density_kg_per_min || []).map((p: TimeSeriesPoint) => ({ timestamp: `${p.date}T00:00:00.000Z`, value: p.value })),
          avgRestSec: includeRest
            ? (normalized[AVG_REST_ID] || []).map((p: TimeSeriesPoint) => ({ timestamp: `${p.date}T00:00:00.000Z`, value: p.value }))
            : undefined,
          setEfficiencyKgPerMin: derivedFlag
            ? (normalized[EFF_ID] || []).map((p: TimeSeriesPoint) => ({ timestamp: `${p.date}T00:00:00.000Z`, value: p.value }))
            : undefined,
        };

        const result: MetricsV2Data = {
          meta: {
            version: 'v2',
            generatedAt: new Date().toISOString(),
            tz: 'Europe/Warsaw',
            unit: 'kg',
          },
          inputs: {
            startISO: params!.startISO,
            endISO: params!.endISO,
            userId: params!.userId,
            unit: 'kg',
            tz: 'Europe/Warsaw',
          },
          kpis: {
            ...totals,
            ...(includeRest ? { avg_rest_sec } : {}),
            ...(derivedFlag ? { set_efficiency_kg_per_min } : {}),
          },
          series,
          totals,
          timingMetadata,
        };

        // Structured logging
        console.log({
          tag: 'metrics-v2.fetch',
          requestId: requestId.current,
          userId: params!.userId,
          startISO: params!.startISO,
          endISO: params!.endISO,
          tz: 'Europe/Warsaw',
          unit: 'kg',
          fromCache,
          durationMs,
          counts: { sets: totals.sets, reps: totals.reps, workouts: response.totals?.workouts ?? 0, days: response.series?.tonnage_kg?.length ?? 0 },
          kpis: {
            tonnage_kg: totals.tonnage_kg,
            duration_min: totals.duration_min,
            density_kg_per_min: totals.density_kg_per_min,
          },
          status: 'success',
        });

        return result;
      } catch (error) {
        const durationMs = performance.now() - t0;
        const errorName = error instanceof Error ? error.name : 'UnknownError';
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        console.log({
          tag: 'metrics-v2.fetch',
          requestId: requestId.current,
          userId: params!.userId,
          startISO: params!.startISO,
          endISO: params!.endISO,
          tz: 'Europe/Warsaw',
          unit: 'kg',
          fromCache,
          durationMs,
          errorName,
          errorMessage,
          status: 'error',
        });

        const derivedFlag = FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED;
        return {
          meta: {
            version: 'v2',
            generatedAt: new Date().toISOString(),
            tz: 'Europe/Warsaw',
            unit: 'kg',
          },
          inputs: {
            startISO: params!.startISO,
            endISO: params!.endISO,
            userId: params!.userId,
            unit: 'kg',
            tz: 'Europe/Warsaw',
          },
          kpis: {
            sets: 0,
            reps: 0,
            duration_min: 0,
            tonnage_kg: 0,
            density_kg_per_min: 0,
            ...(derivedFlag ? { avg_rest_sec: 0, set_efficiency_kg_per_min: 0 } : {}),
          },
          totals: {
            sets: 0,
            reps: 0,
            duration_min: 0,
            tonnage_kg: 0,
            density_kg_per_min: 0,
          },
          error: errorMessage,
        };
      }
    },
    enabled: !!params,
    staleTime: 60000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev, // keepPreviousData equivalent in v5
  });
}
