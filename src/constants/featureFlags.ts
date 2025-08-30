export const SETUP_CHOOSE_EXERCISES_ENABLED =
  (import.meta.env.VITE_SETUP_CHOOSE_EXERCISES_ENABLED ?? 'true') === 'true';

// Gate for derived analytics KPIs (density, avg rest, set efficiency)
export const ANALYTICS_DERIVED_KPIS_ENABLED =
  (import.meta.env.DEV || import.meta.env.VITE_ANALYTICS_DERIVED_KPIS === 'true');
console.debug('[featureFlags] ANALYTICS_DERIVED_KPIS_ENABLED=', ANALYTICS_DERIVED_KPIS_ENABLED);

export const SET_COMPLETE_NOTIFICATIONS_ENABLED =
  (import.meta.env.VITE_SET_COMPLETE_NOTIFICATIONS_ENABLED ?? 'false') === 'true';
console.debug(
  '[featureFlags] SET_COMPLETE_NOTIFICATIONS_ENABLED=',
  SET_COMPLETE_NOTIFICATIONS_ENABLED,
);

export const FEATURE_FLAGS = {
  SETUP_CHOOSE_EXERCISES_ENABLED,
  ANALYTICS_DERIVED_KPIS_ENABLED,
  SET_COMPLETE_NOTIFICATIONS_ENABLED,
} as const;
