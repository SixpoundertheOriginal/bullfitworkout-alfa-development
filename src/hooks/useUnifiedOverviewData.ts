// Unified Overview data hook - single source of truth for Overview components
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDateRange } from '@/context/DateRangeContext';
import { useWeightUnit } from '@/context/WeightUnitContext';
import { OverviewDataUnificationService } from '@/services/overview';

export function useUnifiedOverviewData() {
  const { user } = useAuth();
  const { dateRange } = useDateRange();
  const { weightUnit } = useWeightUnit();

  return useQuery({
    queryKey: ['unified-overview', dateRange, user?.id, weightUnit],
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return OverviewDataUnificationService.getUnifiedOverviewData(dateRange, user.id, weightUnit);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - same as existing hooks
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
}