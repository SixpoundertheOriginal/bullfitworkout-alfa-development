import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { metricsServiceV2 } from '@/services/metrics-v2/service';
import type { AnalyticsServiceData } from '@/pages/analytics/AnalyticsPage';

/**
 * Fetch metrics-v2 data for the current user.
 * The query is disabled when no user id is provided.
 */
export function useMetricsV2(userId?: string) {
  const { start, end } = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // last 30 days
    return { start: startDate, end: endDate };
  }, []);

  const range = useMemo(
    () => ({
      start: start.toISOString(),
      end: end.toISOString(),
    }),
    [start.getTime(), end.getTime()]
  );

  return useQuery<AnalyticsServiceData>({
    queryKey: ['metrics-v2', userId, range.start, range.end],
    queryFn: () =>
      metricsServiceV2.getMetricsV2({
        userId: userId!,
        dateRange: range,
      }) as Promise<AnalyticsServiceData>,
    enabled: !!userId,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

export default useMetricsV2;
