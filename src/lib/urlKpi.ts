/**
 * Utilities for reading/writing KPI analytics URL params while preserving existing params.
 * Source of truth: URL query params `tab` and `kpi`.
 */

export type KpiParam =
  | 'restTimeAvg'
  | 'tonnage'
  | 'duration'
  | 'density'
  | 'sets'
  | 'reps';

export type TabParam = string; // keep generic to avoid coupling with UI

export type KpiState = {
  tab?: TabParam;
  kpi?: KpiParam;
};

/**
 * Parse `tab` and `kpi` from a search string. Unknown values are left as-is.
 */
export function parseKpiParams(search: string): KpiState {
  const sp = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const tab = sp.get('tab') || undefined;
  const kpi = (sp.get('kpi') || undefined) as KpiParam | undefined;
  return { tab, kpi };
}

/**
 * Return a new URL string with `tab`/`kpi` written, preserving existing params.
 * - Unknown/missing params are not touched unless provided in `next`.
 * - Passing `undefined` for a field removes that param.
 */
export function writeKpiParams(
  url: string,
  next: KpiState
): string {
  const u = new URL(url, 'http://dummy'); // base to satisfy URL parsing
  const sp = new URLSearchParams(u.search);

  if ('tab' in next) {
    if (next.tab) sp.set('tab', next.tab);
    else sp.delete('tab');
  }
  if ('kpi' in next) {
    if (next.kpi) sp.set('kpi', next.kpi);
    else sp.delete('kpi');
  }

  const qs = sp.toString();
  const path = u.pathname + (qs ? `?${qs}` : '');
  const hash = u.hash || '';
  return path + hash;
}

/**
 * Apply graceful defaults.
 * - unknown or missing `kpi` -> 'restTimeAvg'
 * - missing `tab` -> leave undefined so caller can decide (e.g., snapshot tab)
 */
export function withDefaults(state: KpiState): Required<Pick<KpiState, 'kpi'>> & KpiState {
  const allowed: KpiParam[] = ['restTimeAvg', 'tonnage', 'duration', 'density', 'sets', 'reps'];
  const kpi = allowed.includes(state.kpi as KpiParam) ? (state.kpi as KpiParam) : 'restTimeAvg';
  return { ...state, kpi };
}

