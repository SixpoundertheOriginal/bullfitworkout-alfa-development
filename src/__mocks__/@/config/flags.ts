import { vi } from 'vitest';

export const useFeatureFlag = vi.fn((flag: string) => {
  if (flag === 'KPI_ANALYTICS_ENABLED') return true;
  if (flag === 'BW_LOADS_ENABLED') return true;
  return false;
});

export const isFeatureEnabled = useFeatureFlag;

export const FEATURE_FLAGS = {
  KPI_ANALYTICS_ENABLED: true,
  BW_LOADS_ENABLED: true,
};

export default {
  useFeatureFlag,
  isFeatureEnabled,
  FEATURE_FLAGS,
};
