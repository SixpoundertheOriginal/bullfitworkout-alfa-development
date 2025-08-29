export const SETUP_CHOOSE_EXERCISES_ENABLED =
  (import.meta.env.VITE_SETUP_CHOOSE_EXERCISES_ENABLED ?? 'true') === 'true';

// Gate for derived analytics KPIs (density, avg rest, set efficiency)
export const ANALYTICS_DERIVED_KPIS_ENABLED =
  (import.meta.env.DEV || import.meta.env.VITE_ANALYTICS_DERIVED_KPIS === 'true');
