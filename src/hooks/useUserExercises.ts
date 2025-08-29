import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { metricsServiceV2 } from '@/services/metrics-v2/service';
import { useDateRange } from '@/context/DateRangeContext';

// Temporary hook: fetch exercise list via repository through service facade
export function useUserExercises() {
  const { user } = useAuth();
  const { dateRange } = useDateRange();
  return useQuery({
    queryKey: ['user-exercises', user?.id, dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    enabled: !!user?.id && !!dateRange.from && !!dateRange.to,
    queryFn: async () => {
      // Access repository through service: we expose repo via service (temporary shim)
      const svc: any = metricsServiceV2 as any;
      if (typeof svc._getRepo !== 'function') return [];
      const repo = svc._getRepo();
      return repo.getUserExercises(user!.id, { start: dateRange.from!.toISOString(), end: dateRange.to!.toISOString() });
    },
  });
}

