import { useQuery } from '@tanstack/react-query';
import { metricsServiceV2 } from '@/services/metrics-v2/service';
import type { AnalyticsServiceData } from '@/pages/analytics/AnalyticsPage';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { DEFS_VERSION } from '@/services/metrics-v2/registry';
import { TONNAGE_ID } from '@/pages/analytics/metricIds';

interface RangeParams {
  startISO: string;
  endISO: string;
  includeBodyweightLoads?: boolean;
  includeTimePeriodAverages?: boolean;
  bodyweightKg?: number;
}

export default function useMetricsV2(
  userId?: string,
  range?: RangeParams
) {
  const includeBodyweight = range?.includeBodyweightLoads ?? FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED;
  const includeTimePeriodAverages = range?.includeTimePeriodAverages ?? false;
  const bodyweightKg = range?.bodyweightKg ?? 75;
  const startISO = range?.startISO;
  const endISO = range?.endISO;
  return useQuery<AnalyticsServiceData>({
    queryKey: ['metricsV2', startISO, endISO, includeBodyweight, includeTimePeriodAverages, bodyweightKg, DEFS_VERSION],
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
          const points = res?.series?.[TONNAGE_ID]?.length || 0;
          console.debug('[MetricsV2][debug] series points:', points);
          return res as AnalyticsServiceData;
        });
    },
    enabled: !!userId && !!startISO && !!endISO,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}
