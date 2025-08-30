import { useQuery } from '@tanstack/react-query';
import { metricsServiceV2 } from '@/services/metrics-v2/service';
import type { AnalyticsServiceData } from '@/pages/analytics/AnalyticsPage';

/**
 * Fetch metrics-v2 data for the current user.
 * The query is disabled when no user id is provided.
 */
export function useMetricsV2(userId?: string) {
  const now = new Date();
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // last 30 days
  return useQuery<AnalyticsServiceData>({
    queryKey: ['metrics-v2', userId, start.toISOString(), now.toISOString()],
    queryFn: () =>
      metricsServiceV2.getMetricsV2({
        userId: userId!,
        dateRange: { start: start.toISOString(), end: now.toISOString() },
      }) as Promise<AnalyticsServiceData>,
    enabled: !!userId,
  });
}

export default useMetricsV2;
