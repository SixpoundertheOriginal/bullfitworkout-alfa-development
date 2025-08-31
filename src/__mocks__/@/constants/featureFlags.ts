export const FEATURE_FLAGS = {
  KPI_ANALYTICS_ENABLED: true,
  ANALYTICS_DERIVED_KPIS_ENABLED: false,
  SETUP_CHOOSE_EXERCISES_ENABLED: true,
  SET_COMPLETE_NOTIFICATIONS_ENABLED: false,
};
export const useFeatureFlags = () => FEATURE_FLAGS;
export const setFlagOverride = () => {};
export const logFlagsOnce = () => {};
