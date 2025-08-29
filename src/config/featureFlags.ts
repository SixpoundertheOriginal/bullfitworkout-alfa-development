// Feature flags for gradual rollout
export const FEATURE_FLAGS = {
  // Analytics derived KPIs (density, rest time analysis, set efficiency)
  ANALYTICS_DERIVED_KPIS_ENABLED: process.env.NODE_ENV === 'development' ||
    process.env.VITE_ANALYTICS_DERIVED_KPIS === 'true',

  // Other existing flags can be added here
} as const;
console.debug('[config/featureFlags] ANALYTICS_DERIVED_KPIS_ENABLED=', FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED);
