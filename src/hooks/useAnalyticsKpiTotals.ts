import React from 'react';
import { useMetricsV2Analytics } from '@/hooks/useMetricsV2';
import { normalizeTotals } from '@/services/metrics-v2/chartAdapter';
import { useFeatureFlags } from '@/constants/featureFlags';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import type { AnalyticsServiceData } from '@/pages/analytics/AnalyticsPage';

const round2 = (n: number) => Math.round(n * 100) / 100;
const has = (n?: number) => typeof n === 'number' && n > 0;

function safeDiv(a: number, b?: number): number {
  return has(b) ? a / (b as number) : 0;
}

export type AnalyticsKpiTotals = {
  baseTotals: {
    sets: number;
    reps: number;
    duration_min: number;
    tonnage_kg: number;
    density_kg_per_min: number;
    rest_min?: number;
    active_min?: number;
  };
  derivedTotals: Partial<{
    avg_reps_per_set: number;
    avg_tonnage_per_set_kg: number;
    avg_tonnage_per_rep_kg: number;
    avg_rest_sec: number | undefined;
    avg_duration_per_set_min: number;
    set_efficiency_kg_per_min: number;
  }>;
  diagnostics?: Record<string, DiagnosticSource>;
};

type DiagnosticSource =
  | 'v2'
  | 'rest_min_per_set'
  | 'active_min'
  | 'density_fallback'
  | 'none';

export function useAnalyticsKpiTotals(
  v2Data?: any,
  legacyData?: AnalyticsServiceData
): AnalyticsKpiTotals {
  const { ANALYTICS_DERIVED_KPIS_ENABLED, KPI_DIAGNOSTICS_ENABLED } = useFeatureFlags();

  return React.useMemo(() => {
    // Step 1: Normalize and extract base totals via SSOT
    const rawTotals = v2Data?.totals || legacyData?.totals || {};
    const normalized = normalizeTotals(rawTotals);
    
    const sets = normalized.sets ?? 0;
    const reps = normalized.reps ?? 0;
    const duration_min = round2(normalized.duration_min ?? 0);
    const tonnage_kg = round2(normalized.tonnage_kg ?? 0);
    const rest_min = normalized.rest_min ? round2(normalized.rest_min) : undefined;
    const active_min = normalized.active_min ? round2(normalized.active_min) : undefined;
    
    // Density fallback calculation
    let density_kg_per_min = normalized.density_kg_per_min;
    if (density_kg_per_min == null) {
      density_kg_per_min = duration_min > 0 ? round2(tonnage_kg / duration_min) : 0;
    } else {
      density_kg_per_min = round2(density_kg_per_min);
    }

    const baseTotals = {
      sets,
      reps,
      duration_min,
      tonnage_kg,
      density_kg_per_min,
      ...(rest_min !== undefined && { rest_min }),
      ...(active_min !== undefined && { active_min })
    };

    // Step 2: Compute derived KPIs (only if flag enabled)
    const derivedTotals: AnalyticsKpiTotals['derivedTotals'] = {};
    const diagnostics: Record<string, DiagnosticSource> = {};

    if (ANALYTICS_DERIVED_KPIS_ENABLED) {
      // Derived calculations
      derivedTotals.avg_reps_per_set = safeDiv(reps, sets);
      derivedTotals.avg_tonnage_per_set_kg = safeDiv(tonnage_kg, sets);
      derivedTotals.avg_tonnage_per_rep_kg = safeDiv(tonnage_kg, reps);
      derivedTotals.avg_duration_per_set_min = safeDiv(duration_min, sets);

      // avg_rest_sec
      if (has(v2Data?.kpis?.avg_rest_sec)) {
        derivedTotals.avg_rest_sec = v2Data.kpis.avg_rest_sec;
        if (KPI_DIAGNOSTICS_ENABLED) diagnostics.avg_rest_sec = 'v2';
      } else if (has(rest_min) && sets > 0) {
        derivedTotals.avg_rest_sec = (rest_min as number) * 60 / sets;
        if (KPI_DIAGNOSTICS_ENABLED) diagnostics.avg_rest_sec = 'rest_min_per_set';
      } else {
        derivedTotals.avg_rest_sec = undefined;
        if (KPI_DIAGNOSTICS_ENABLED) diagnostics.avg_rest_sec = 'none';
      }

      // set_efficiency_kg_per_min
      if (has(v2Data?.kpis?.set_efficiency_kg_per_min)) {
        derivedTotals.set_efficiency_kg_per_min = v2Data.kpis.set_efficiency_kg_per_min;
        if (KPI_DIAGNOSTICS_ENABLED) diagnostics.set_efficiency_kg_per_min = 'v2';
      } else if (has(active_min)) {
        derivedTotals.set_efficiency_kg_per_min = safeDiv(tonnage_kg, active_min);
        if (KPI_DIAGNOSTICS_ENABLED) diagnostics.set_efficiency_kg_per_min = 'active_min';
      } else if (has(density_kg_per_min)) {
        derivedTotals.set_efficiency_kg_per_min = density_kg_per_min;
        if (KPI_DIAGNOSTICS_ENABLED) diagnostics.set_efficiency_kg_per_min = 'density_fallback';
      } else {
        derivedTotals.set_efficiency_kg_per_min = 0;
        if (KPI_DIAGNOSTICS_ENABLED) diagnostics.set_efficiency_kg_per_min = 'none';
      }

      // Round all derived values
      Object.keys(derivedTotals).forEach(key => {
        const value = derivedTotals[key as keyof typeof derivedTotals];
        if (typeof value === 'number') {
          (derivedTotals as any)[key] = round2(value);
        }
      });
    }

    // Step 3: Diagnostics logging
    if (KPI_DIAGNOSTICS_ENABLED) {
      console.debug('kpi_diagnostics', diagnostics);
    }

    return {
      baseTotals,
      derivedTotals,
      ...(KPI_DIAGNOSTICS_ENABLED && { diagnostics })
    };
  }, [v2Data, legacyData, ANALYTICS_DERIVED_KPIS_ENABLED, KPI_DIAGNOSTICS_ENABLED]);
}