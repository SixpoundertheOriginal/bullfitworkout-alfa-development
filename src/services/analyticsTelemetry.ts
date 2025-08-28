/**
 * Minimal telemetry stubs for KPI Analytics events.
 * Replace console logs with your analytics backend as needed.
 */

type FiltersDto = Record<string, string | number | boolean | null | undefined>;

export function analytics_view_opened(payload: { kpi?: string; filters?: FiltersDto }) {
  // Non-intrusive stub to be used in components when wiring
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[telemetry] analytics_view_opened', payload);
  }
}

export function kpi_series_loaded(payload: { ms: number; count: number; kpi?: string; filters?: FiltersDto }) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[telemetry] kpi_series_loaded', payload);
  }
}

