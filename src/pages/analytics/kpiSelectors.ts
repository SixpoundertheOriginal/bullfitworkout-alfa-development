import type { MetricsV2Data } from '@/hooks/useMetricsV2';
import {
  SETS_ID,
  REPS_ID,
  DURATION_ID,
  TONNAGE_ID,
  DENSITY_ID,
} from './metricIds';

export function getSets(
  v2?: MetricsV2Data & { totals?: Record<string, number> },
  legacyTotals?: Record<string, number>
): number {
  return v2?.kpis?.sets ?? v2?.totals?.[SETS_ID] ?? legacyTotals?.[SETS_ID] ?? 0;
}

export function getReps(
  v2?: MetricsV2Data & { totals?: Record<string, number> },
  legacyTotals?: Record<string, number>
): number {
  return v2?.kpis?.reps ?? v2?.totals?.[REPS_ID] ?? legacyTotals?.[REPS_ID] ?? 0;
}

export function getDuration(
  v2?: MetricsV2Data & { totals?: Record<string, number> },
  legacyTotals?: Record<string, number>
): number {
  return v2?.kpis?.durationMin ?? v2?.totals?.[DURATION_ID] ?? legacyTotals?.[DURATION_ID] ?? 0;
}

export function getTonnage(
  v2?: MetricsV2Data & { totals?: Record<string, number> },
  legacyTotals?: Record<string, number>
): number {
  return v2?.kpis?.tonnageKg ?? v2?.totals?.[TONNAGE_ID] ?? legacyTotals?.[TONNAGE_ID] ?? 0;
}

export function getDensity(
  v2?: MetricsV2Data & { totals?: Record<string, number> },
  legacyTotals?: Record<string, number>
): number {
  return v2?.kpis?.densityKgPerMin ?? v2?.totals?.[DENSITY_ID] ?? legacyTotals?.[DENSITY_ID] ?? 0;
}
