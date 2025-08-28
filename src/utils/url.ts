// Utilities for parsing and writing KPI tab/url params

export type KpiTabParams = {
  tab?: string;
  kpi?: string;
};

// Parse known kpi/tab params from a URLSearchParams or query string, preserving others
export function parseKpiTabParams(queryString: string): KpiTabParams {
  const params = new URLSearchParams(queryString);
  const tab = params.get('tab') || undefined;
  const kpi = params.get('kpi') || undefined;
  return { tab, kpi };
}

// Write kpi/tab into existing query string while preserving other params
export function writeKpiTabParams(queryString: string, paramsToSet: KpiTabParams): string {
  const params = new URLSearchParams(queryString);
  if (paramsToSet.tab === undefined) {
    params.delete('tab');
  } else {
    params.set('tab', paramsToSet.tab);
  }

  if (paramsToSet.kpi === undefined) {
    params.delete('kpi');
  } else {
    params.set('kpi', paramsToSet.kpi);
  }

  return params.toString() ? `?${params.toString()}` : '';
}
