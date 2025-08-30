import { useQuery } from '@tanstack/react-query';
import { metricsServiceV2 } from '@/services/metrics-v2/service';
import type { AnalyticsServiceData } from '@/pages/analytics/AnalyticsPage';

interface RangeParams {
  startISO: string;
  endISO: string;
  includeBodyweightLoads: boolean;
}

export default function useMetricsV2(
  userId?: string,
  range?: RangeParams
) {
  return useQuery<AnalyticsServiceData>({
    queryKey: ['metricsV2', userId, range?.startISO, range?.endISO, range?.includeBodyweightLoads],
    queryFn: () =>
      metricsServiceV2.getMetricsV2({
        userId: userId!,
        dateRange: { start: range!.startISO, end: range!.endISO },
        includeBodyweightLoads: range?.includeBodyweightLoads,
      }) as Promise<AnalyticsServiceData>,
    enabled: !!userId && !!range,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}
