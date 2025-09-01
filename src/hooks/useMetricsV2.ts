import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { metricsServiceV2 } from '@/services/metrics-v2/service';
import type { AnalyticsServiceData } from '@/pages/analytics/AnalyticsPage';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { DEFS_VERSION } from '@/services/metrics-v2/registry';
import { TONNAGE_ID, AVG_REST_ID, EFF_ID } from '@/pages/analytics/metricIds';
import { normalizeSeriesKeys } from '@/services/metrics-v2/chartAdapter';

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
    durationMin: number;
    tonnageKg: number;
    densityKgPerMin: number;
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
        .then((res: any) => {
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
        
        // Transform to V2 DTO format with 2-decimal rounding
        const sets = response.totals?.sets_count ?? 0;
        const reps = response.totals?.reps_total ?? 0;
        const durationMin = Math.round((response.totals?.duration_min ?? 0) * 100) / 100;
        const tonnageKg = Math.round((response.totals?.tonnage_kg ?? 0) * 100) / 100;
        const densityKgPerMin = durationMin > 0
          ? Math.round((tonnageKg / durationMin) * 100) / 100
          : 0;
        const timingMetadata = response.timingMetadata;
        const derivedFlag = FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED;
        const includeRest = derivedFlag && timingMetadata?.quality === 'high';
        const avgRestSec = includeRest
          ? Math.round((response.totals?.[AVG_REST_ID] ?? 0) * 100) / 100
          : undefined;
        const setEfficiencyKgPerMin = derivedFlag
          ? Math.round((response.totals?.[EFF_ID] ?? 0) * 100) / 100
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
          sets: (normalized.sets || []).map((p: any) => ({ timestamp: `${p.date}T00:00:00.000Z`, value: p.value })),
          reps: (normalized.reps || []).map((p: any) => ({ timestamp: `${p.date}T00:00:00.000Z`, value: p.value })),
          durationMin: (normalized.duration_min || []).map((p: any) => ({ timestamp: `${p.date}T00:00:00.000Z`, value: p.value })),
          tonnageKg: (normalized.tonnage_kg || []).map((p: any) => ({ timestamp: `${p.date}T00:00:00.000Z`, value: p.value })),
          densityKgPerMin: (normalized.density_kg_per_min || []).map((p: any) => ({ timestamp: `${p.date}T00:00:00.000Z`, value: p.value })),
          avgRestSec: includeRest
            ? (normalized[AVG_REST_ID] || []).map((p: any) => ({ timestamp: `${p.date}T00:00:00.000Z`, value: p.value }))
            : undefined,
          setEfficiencyKgPerMin: derivedFlag
            ? (normalized[EFF_ID] || []).map((p: any) => ({ timestamp: `${p.date}T00:00:00.000Z`, value: p.value }))
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
            sets,
            reps,
            durationMin,
            tonnageKg,
            densityKgPerMin,
            ...(includeRest ? { avgRestSec } : {}),
            ...(derivedFlag ? { setEfficiencyKgPerMin } : {}),
          },
          series,
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
          counts: { sets, reps, workouts: response.totals?.workouts ?? 0, days: response.series?.tonnage_kg?.length ?? 0 },
          kpis: { tonnageKg, durationMin, densityKgPerMin },
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
            durationMin: 0,
            tonnageKg: 0,
            densityKgPerMin: 0,
            ...(derivedFlag ? { avgRestSec: 0, setEfficiencyKgPerMin: 0 } : {}),
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
